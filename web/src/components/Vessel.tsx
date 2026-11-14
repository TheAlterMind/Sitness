import { useEffect, useId, useState } from 'react'

function wave(top: number, ph: number, amp: number, close: boolean): string {
  let d = ''
  for (let x = -8; x <= 108; x += 4) {
    const y = top + Math.sin(x / 13 + ph) * amp + Math.sin(x / 6.5 + ph * 1.7) * amp * 0.35
    d += `${d ? 'L' : 'M'}${x} ${y.toFixed(2)}`
  }
  return close ? `${d}L108 108L-8 108Z` : d
}

/** The break timer: a vessel that fills with liquid as the break elapses. */
export function Vessel({ progress }: { progress: number }) {
  const clipId = useId()
  const [phase, setPhase] = useState(0)

  // The browser stops requestAnimationFrame when the page is hidden, so this costs nothing unseen.
  useEffect(() => {
    let raf = 0
    const tick = () => { setPhase(p => p + 0.09); raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const top = 93.5 - Math.min(1, Math.max(0, progress)) * 87

  return (
    <svg viewBox="0 0 100 100" className="vessel" role="img" aria-label="Break progress">
      <defs>
        <clipPath id={clipId}><circle cx="50" cy="50" r="41.5" /></clipPath>
      </defs>
      <circle cx="50" cy="50" r="41.5" fill="var(--well)" />
      <g clipPath={`url(#${clipId})`}>
        <path d={wave(top + 1.6, phase * 0.8 + 2.1, 1.9, true)} fill="var(--accent)" opacity="0.16" />
        <path d={wave(top, phase, 1.5, true)} fill="var(--accent)" opacity="0.32" />
        <path d={wave(top, phase, 1.5, false)} fill="none" stroke="var(--accent)" strokeWidth="1.1" opacity="0.9" />
      </g>
      <circle cx="50" cy="50" r="45" fill="none" stroke="var(--track)" strokeWidth="6" />
    </svg>
  )
}
