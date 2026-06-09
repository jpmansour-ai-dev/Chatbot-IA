import { useEffect, useState } from "react"

/**
 * Reveals `text` progressively, token by token (words and whitespace preserved),
 * to mimic live "generation" the way Claude/ChatGPT stream their answers.
 *
 * The backend stores the full reply (the UI polls until it is ready), so this is
 * a client-side reveal of the already-complete text — not true token streaming —
 * but it reads the same to the user. Returns the revealed substring and whether
 * the reveal has finished. When `enabled` is false the whole text is shown at once.
 */
export function useTypewriter(text: string, enabled = true, tokenDelayMs = 28) {
  const [shown, setShown] = useState(enabled ? "" : text)
  const [done, setDone] = useState(!enabled)

  useEffect(() => {
    if (!enabled) {
      setShown(text)
      setDone(true)
      return
    }

    // Split on whitespace but keep the separators so newlines/spacing survive.
    const tokens = text.split(/(\s+)/).filter((token) => token.length > 0)
    if (tokens.length === 0) {
      setShown("")
      setDone(true)
      return
    }

    setShown("")
    setDone(false)
    let revealed = 0
    const id = setInterval(() => {
      revealed += 1
      setShown(tokens.slice(0, revealed).join(""))
      if (revealed >= tokens.length) {
        setDone(true)
        clearInterval(id)
      }
    }, tokenDelayMs)

    return () => clearInterval(id)
  }, [text, enabled, tokenDelayMs])

  return { shown, done }
}
