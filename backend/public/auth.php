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

function publicUser(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'role' => $row['role'],
    ];
}

function findUser(PDO $pdo, int $id): ?array
{
    $statement = $pdo->prepare('SELECT id, name, email, role FROM users WHERE id = :id');
    $statement->execute(['id' => $id]);
    $user = $statement->fetch();
    return $user === false ? null : publicUser($user);
}

function readRequestBody(): array
{
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        respond(400, ['message' => 'Le contenu de la requête est invalide.']);
    }
    return $body;
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

$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$allowedActions = [
    'GET' => ['me', 'directory'],
    'POST' => ['register', 'login', 'logout'],
];

if (!isset($allowedActions[$method]) || !in_array($action, $allowedActions[$method], true)) {
    respond(404, ['message' => 'Route d’authentification introuvable.']);
}

startSession();

try {
    $pdo = database();

    if ($action === 'me') {
        $userId = $_SESSION['user_id'] ?? null;
        $user = is_int($userId) ? findUser($pdo, $userId) : null;
        if ($user === null) {
            unset($_SESSION['user_id']);
        }
        respond(200, ['user' => $user]);
    }

    if ($action === 'directory') {
        $userId = $_SESSION['user_id'] ?? null;
        if (!is_int($userId) || findUser($pdo, $userId) === null) {
            respond(401, ['message' => 'Connectez-vous pour consulter les comptes.']);
        }
        $users = $pdo->query('SELECT id, name, email, role FROM users ORDER BY name, id')->fetchAll();
        foreach ($users as &$user) {
            $user['id'] = (int) $user['id'];
        }
        unset($user);
        respond(200, ['users' => $users]);
    }

    if ($action === 'logout') {
        $_SESSION = [];
        session_destroy();
        setcookie(session_name(), '', [
            'expires' => time() - 3600,
            'httponly' => true,
            'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'samesite' => 'Lax',
            'path' => '/',
        ]);
        respond(200, ['user' => null]);
    }

    $body = readRequestBody();
    $email = strtolower(trim(is_string($body['email'] ?? null) ? $body['email'] : ''));
    $password = is_string($body['password'] ?? null) ? $body['password'] : '';

    if (filter_var($email, FILTER_VALIDATE_EMAIL) === false || strlen($email) > 254) {
        respond(422, ['message' => 'Saisissez une adresse e-mail valide.']);
    }
    if (strlen($password) < 8 || strlen($password) > 72) {
        respond(422, ['message' => 'Le mot de passe doit contenir entre 8 et 72 caractères.']);
    }

    if ($action === 'register') {
        $name = trim(is_string($body['name'] ?? null) ? $body['name'] : '');
        if ($name === '' || mb_strlen($name) > 100) {
            respond(422, ['message' => 'Le nom complet est obligatoire (100 caractères maximum).']);
        }

        $statement = $pdo->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (:name, :email, :password_hash, :role)');
        try {
            $statement->execute([
                'name' => $name,
                'email' => $email,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                'role' => 'viewer',
            ]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                respond(409, ['message' => 'Un compte existe déjà avec cette adresse e-mail.']);
            }
            throw $error;
        }

        session_regenerate_id(true);
        $_SESSION['user_id'] = (int) $pdo->lastInsertId();
        respond(201, ['user' => findUser($pdo, $_SESSION['user_id'])]);
    }

    $statement = $pdo->prepare('SELECT id, password_hash FROM users WHERE email = :email');
    $statement->execute(['email' => $email]);
    $account = $statement->fetch();
    if ($account === false || !password_verify($password, $account['password_hash'])) {
        respond(401, ['message' => 'Adresse e-mail ou mot de passe incorrect.']);
    }

    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $account['id'];
    respond(200, ['user' => findUser($pdo, $_SESSION['user_id'])]);
} catch (Throwable $error) {
    error_log('NexusOps auth API: ' . $error->getMessage());
    respond(500, ['message' => 'Le serveur d’authentification ne peut pas traiter la requête. Vérifiez la configuration MySQL.']);
}
