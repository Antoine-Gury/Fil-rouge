<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, array $data): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function database(): PDO
{
    $host = getenv('NEXUSOPS_DB_HOST') ?: '127.0.0.1';
    $port = getenv('NEXUSOPS_DB_PORT') ?: '3306';
    $name = getenv('NEXUSOPS_DB_NAME') ?: 'nexusops';
    $user = getenv('NEXUSOPS_DB_USER') ?: 'root';
    $password = getenv('NEXUSOPS_DB_PASSWORD');

    return new PDO(
        "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4",
        $user,
        $password === false ? '' : $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ],
    );
}

function startSession(): void
{
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    session_set_cookie_params([
        'httponly' => true,
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'samesite' => 'Lax',
        'path' => '/',
    ]);
    session_start();
}

function readBody(): array
{
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        respond(400, ['message' => 'Le contenu de la requête est invalide.']);
    }
    return $body;
}

function jsonServer(string $method, string $path, ?array $body = null): array
{
    $url = 'http://localhost:3001/' . $path;
    $options = [
        'http' => [
            'method' => $method,
            'ignore_errors' => true,
            'timeout' => 5,
            'header' => "Content-Type: application/json\r\n",
        ],
    ];
    if ($body !== null) {
        $options['http']['content'] = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }

    $response = @file_get_contents($url, false, stream_context_create($options));
    if ($response === false) {
        respond(502, ['message' => 'Impossible de joindre le serveur des équipements et incidents. Vérifiez que json-server est démarré.']);
    }

    $status = 502;
    foreach ($http_response_header as $header) {
        if (preg_match('/^HTTP\/\S+\s+(\d{3})/', $header, $matches)) {
            $status = (int) $matches[1];
        }
    }
    $data = json_decode($response, true);
    if (!is_array($data)) {
        respond(502, ['message' => 'Le serveur des équipements et incidents a renvoyé une réponse invalide.']);
    }

    if ($status < 200 || $status >= 300) {
        respond($status, $data);
    }
    return $data;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$allowedActions = [
    'GET' => ['users'],
    'PATCH' => ['user-role', 'equipment', 'incident'],
    'POST' => ['equipment'],
    'DELETE' => ['user', 'equipment', 'incident'],
];

if (!isset($allowedActions[$method]) || !in_array($action, $allowedActions[$method], true)) {
    respond(404, ['message' => 'Route d’administration introuvable.']);
}

startSession();

try {
    $pdo = database();
    $adminId = $_SESSION['user_id'] ?? null;
    $adminQuery = $pdo->prepare("SELECT id FROM users WHERE id = :id AND role = 'admin'");
    $adminQuery->execute(['id' => $adminId]);
    $admin = $adminQuery->fetch();
    if ($admin === false) {
        respond(403, ['message' => 'Accès réservé aux administrateurs.']);
    }

    if ($action === 'users') {
        $users = $pdo->query('SELECT id, name, email, role FROM users ORDER BY name, id')->fetchAll();
        foreach ($users as &$user) {
            $user['id'] = (int) $user['id'];
        }
        unset($user);
        respond(200, ['users' => $users]);
    }

    if ($action === 'user-role') {
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
        $body = readBody();
        $role = $body['role'] ?? null;
        if ($id === false || $id === null || $id < 1 || !in_array($role, ['admin', 'operator', 'viewer'], true)) {
            respond(422, ['message' => 'Identifiant ou rôle invalide.']);
        }

        $statement = $pdo->prepare('SELECT id, role FROM users WHERE id = :id');
        $statement->execute(['id' => $id]);
        $target = $statement->fetch();
        if ($target === false) {
            respond(404, ['message' => 'Ce compte est introuvable.']);
        }
        if ($id === (int) $adminId && $role !== 'admin') {
            respond(409, ['message' => 'Demandez à un autre administrateur de modifier votre propre rôle.']);
        }
        if ($target['role'] === 'admin' && $role !== 'admin') {
            $adminCount = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
            if ($adminCount <= 1) {
                respond(409, ['message' => 'Impossible de retirer le rôle du dernier administrateur.']);
            }
        }

        $update = $pdo->prepare('UPDATE users SET role = :role WHERE id = :id');
        $update->execute(['role' => $role, 'id' => $id]);
        $user = $pdo->prepare('SELECT id, name, email, role FROM users WHERE id = :id');
        $user->execute(['id' => $id]);
        $updatedUser = $user->fetch();
        $updatedUser['id'] = (int) $updatedUser['id'];
        respond(200, ['user' => $updatedUser]);
    }

    if ($action === 'user') {
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
        if ($id === false || $id === null || $id < 1) {
            respond(422, ['message' => 'Identifiant de compte invalide.']);
        }
        if ($id === (int) $adminId) {
            respond(409, ['message' => 'Vous ne pouvez pas supprimer votre propre compte administrateur.']);
        }

        $statement = $pdo->prepare('SELECT role FROM users WHERE id = :id');
        $statement->execute(['id' => $id]);
        $target = $statement->fetch();
        if ($target === false) {
            respond(404, ['message' => 'Ce compte est introuvable.']);
        }
        if ($target['role'] === 'admin') {
            $adminCount = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
            if ($adminCount <= 1) {
                respond(409, ['message' => 'Impossible de supprimer le dernier administrateur.']);
            }
        }

        $delete = $pdo->prepare('DELETE FROM users WHERE id = :id');
        $delete->execute(['id' => $id]);
        respond(200, ['deleted' => true]);
    }

    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT);
    if ($action === 'equipment' && $method === 'POST') {
        $body = readBody();
        $name = trim(is_string($body['name'] ?? null) ? $body['name'] : '');
        $type = trim(is_string($body['type'] ?? null) ? $body['type'] : '');
        $site = trim(is_string($body['site'] ?? null) ? $body['site'] : '');
        $status = $body['status'] ?? '';
        if ($name === '' || mb_strlen($name) > 120 || $type === '' || mb_strlen($type) > 80 || $site === '' || mb_strlen($site) > 120 || !in_array($status, ['online', 'offline'], true)) {
            respond(422, ['message' => 'Renseignez un nom, un type, un site et un statut valides.']);
        }
        $created = jsonServer('POST', 'equipments', ['name' => $name, 'type' => $type, 'site' => $site, 'status' => $status]);
        respond(201, $created);
    }

    if ($id === false || $id === null || $id < 1) {
        respond(422, ['message' => 'Identifiant de ressource invalide.']);
    }
    if ($action === 'equipment' && $method === 'PATCH') {
        $body = readBody();
        $name = trim(is_string($body['name'] ?? null) ? $body['name'] : '');
        $type = trim(is_string($body['type'] ?? null) ? $body['type'] : '');
        $site = trim(is_string($body['site'] ?? null) ? $body['site'] : '');
        $status = $body['status'] ?? '';
        if ($name === '' || mb_strlen($name) > 120 || $type === '' || mb_strlen($type) > 80 || $site === '' || mb_strlen($site) > 120 || !in_array($status, ['online', 'offline'], true)) {
            respond(422, ['message' => 'Renseignez un nom, un type, un site et un statut valides.']);
        }
        respond(200, jsonServer('PATCH', 'equipments/' . $id, ['name' => $name, 'type' => $type, 'site' => $site, 'status' => $status]));
    }
    if ($action === 'incident' && $method === 'PATCH') {
        $body = readBody();
        $title = trim(is_string($body['title'] ?? null) ? $body['title'] : '');
        $severity = $body['severity'] ?? '';
        $status = $body['status'] ?? '';
        $equipmentId = filter_var($body['equipmentId'] ?? null, FILTER_VALIDATE_INT);
        if ($title === '' || mb_strlen($title) > 120 || !in_array($severity, ['high', 'medium', 'low'], true) || !in_array($status, ['open', 'in_progress', 'resolved'], true) || $equipmentId === false || $equipmentId === null || $equipmentId < 1) {
            respond(422, ['message' => 'Renseignez un titre, un équipement, une sévérité et un statut valides.']);
        }
        respond(200, jsonServer('PATCH', 'incidents/' . $id, [
            'title' => $title,
            'severity' => $severity,
            'status' => $status,
            'equipmentId' => $equipmentId,
        ]));
    }
    if ($method === 'DELETE' && in_array($action, ['equipment', 'incident'], true)) {
        if ($action === 'equipment') {
            $incidents = jsonServer('GET', 'incidents?equipmentId=' . $id);
            if (count($incidents) > 0) {
                respond(409, ['message' => 'Impossible de supprimer un équipement associé à des incidents.']);
            }
        }
        jsonServer('DELETE', ($action === 'equipment' ? 'equipments/' : 'incidents/') . $id);
        respond(200, ['deleted' => true]);
    }
} catch (Throwable $error) {
    error_log('NexusOps admin API: ' . $error->getMessage());
    respond(500, ['message' => 'Le serveur d’administration ne peut pas traiter la requête. Vérifiez la configuration MySQL et json-server.']);
}

respond(404, ['message' => 'Route d’administration introuvable.']);
