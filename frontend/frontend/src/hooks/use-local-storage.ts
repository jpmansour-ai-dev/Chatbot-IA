import { useCallback, useState } from "react"

/** Persist a JSON-serializable value in localStorage, with in-memory state. */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw !== null ? (JSON.parse(raw) as T) : initialValue
    } catch {
      // Storage unavailable (private mode / quota) — fall back to the default.
      return initialValue
    }
  })

  const set = useCallback(
    (next: T) => {
      setValue(next)
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // Best-effort persistence; ignore storage failures.
      }
    },
    [key],
  )

  return [value, set]
}
