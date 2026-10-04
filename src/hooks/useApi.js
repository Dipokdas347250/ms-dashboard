import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Runs `fetcher` on mount and whenever `deps` change.
 * Returns { data, error, loading, reload, setData }. Stale responses are ignored.
 */
export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const callId = useRef(0)

  const load = useCallback(async () => {
    const id = ++callId.current
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const { data } = await fetcher()
      if (id === callId.current) setState({ data, error: null, loading: false })
    } catch (error) {
      if (id === callId.current) setState((s) => ({ ...s, error, loading: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    load()
  }, [load])

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }))
  }, [])

  return { ...state, reload: load, setData }
}

// Debounces a fast-changing value (e.g. search input).
export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}
