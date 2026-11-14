// Scales the whole interface with the window.
//
// All sizes in the CSS are in rem (see postcss.config.js), so the interface is scaled by changing
// the root font size. The size follows the window: 16px up to an 800px-tall window (so a phone is
// unchanged), then growing with it, so a 4K screen gets a proportionally larger interface.
//
// Layout breakpoints are judged in the same scaled units (what fits at 16px), not raw pixels, so a
// large interface on a small window still switches to the compact layouts when it needs to.

const KEY = 'sitness.uiScale'

export const SCALE_CHOICES: { label: string; value: number }[] = [
  { label: 'Smaller', value: 0.85 },
  { label: 'Automatic', value: 1 },
  { label: 'Larger', value: 1.25 },
  { label: 'Largest', value: 1.5 },
]

export function getUserScale(): number {
  try {
    const v = Number(localStorage.getItem(KEY))
    if (SCALE_CHOICES.some(c => c.value === v)) return v
  } catch { /* storage unavailable */ }
  return 1
}

export function setUserScale(v: number): void {
  try { localStorage.setItem(KEY, String(v)) } catch { /* storage unavailable */ }
  applyScale()
}

/** Root font size for a window: 2% of its height, capped by 4.4% of its width, never below 16px. */
export function rootSize(width: number, height: number, user = 1): number {
  const auto = Math.min(0.02 * height, 0.044 * width)
  return Math.min(Math.max(16, auto) * user, 96)
}

export function applyScale(): void {
  const w = window.innerWidth
  const h = window.innerHeight
  const root = document.documentElement
  const px = rootSize(w, h, getUserScale())
  root.style.fontSize = `${px.toFixed(2)}px`

  // The window as the interface sees it: how many 16px-units fit.
  const ew = (w * 16) / px
  const eh = (h * 16) / px
  root.classList.toggle('lw', ew >= 700)                       // room for the framed column
  root.classList.toggle('lwide', ew >= 880)                    // room for two-column Stats
  root.classList.toggle('lshort', ew > eh && eh <= 560)        // short landscape: side-by-side layouts
}

/** Applies the scale now and keeps it up to date as the window changes. */
export function startScaling(): void {
  applyScale()
  window.addEventListener('resize', applyScale)
  window.addEventListener('orientationchange', applyScale)
}
