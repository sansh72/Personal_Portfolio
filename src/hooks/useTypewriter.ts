import { useEffect, useState } from 'react'

/**
 * Reveals `text` a few characters at a time.
 *
 * Deliberately has no reset: the panel that uses this is keyed by suggestion
 * id, so a new suggestion remounts it and starts from zero. Resetting inside
 * an effect would mean a synchronous setState on every text change.
 */
export function useTypewriter(text: string, { speed = 16, charsPerTick = 2, instant = false } = {}) {
  const [count, setCount] = useState(instant ? text.length : 0)

  useEffect(() => {
    if (instant || !text) return
    const id = setInterval(() => {
      setCount((c) => {
        if (c >= text.length) {
          clearInterval(id)
          return c
        }
        return Math.min(c + charsPerTick, text.length)
      })
    }, speed)
    return () => clearInterval(id)
  }, [text, speed, charsPerTick, instant])

  return { shown: text.slice(0, count), done: count >= text.length }
}
