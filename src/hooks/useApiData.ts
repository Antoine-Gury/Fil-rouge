import { useCallback, useEffect, useState } from 'react'

export function useApiData<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestNumber, setRequestNumber] = useState(0)

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    setRequestNumber((current) => current + 1)
  }, [])

  useEffect(() => {
    let active = true

    load().then((result) => {
      if (active) setData(result)
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Une erreur inconnue est survenue.')
    }).finally(() => {
      if (active) setLoading(false)
    })

    return () => {
      active = false
    }
  }, [load, requestNumber])

  return { data, loading, error, reload }
}
