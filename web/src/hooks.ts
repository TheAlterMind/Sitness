import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Reads a value from the native side now, on a timer, and whenever the app comes back to the
 * foreground. The native side owns the data; the page just keeps looking at it.
 */
export function usePoll<T>(read: () => T, intervalMs: number | null): [T | undefined, () => void] {
  const [value, setValue] = useState<T | undefined>(() => {
    try { return read() } catch { return undefined }
  })
  const readRef = useRef(read)
  readRef.current = read

  const refresh = useCallback(() => {
    try { setValue(readRef.current()) } catch { /* the next tick tries again */ }
  }, [])

  useEffect(() => {
    refresh()
    const onResume = () => refresh()
    window.addEventListener('sitness:resume', onResume)
    const timer = intervalMs ? window.setInterval(refresh, intervalMs) : undefined
    return () => {
      window.removeEventListener('sitness:resume', onResume)
      if (timer) window.clearInterval(timer)
    }
  }, [intervalMs, refresh])

  return [value, refresh]
}

/** Counts from 0 up to [target] over [ms], restarting when the target changes. */
export function useCountUp(target: number, ms = 700): number {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (target <= 0) { setN(0); return }
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms)
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return n
}
