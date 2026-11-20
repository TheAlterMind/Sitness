import { api } from './bridge'

export const ACCENTS: Record<string, string> = {
  violet: '#8E71E6',
  teal: '#2FB6A0',
  amber: '#D89C46',
  coral: '#EA6A50',
}

// The light background must match res/values/colors.xml, which tints the system bars.
const LIGHT_BG = '#F4F6F7'

/** The dark background: 90% black mixed with 10% of the accent, so it follows the accent. */
export function darkBackground(accentHex: string): string {
  const n = parseInt(accentHex.slice(1), 16)
  const mix = (c: number) => Math.round(c * 0.1).toString(16).padStart(2, '0')
  return '#' + mix((n >> 16) & 255) + mix((n >> 8) & 255) + mix(n & 255)
}

/** The grey of the menu, ring track, Pause button and cards in dark mode: 90% of #1A1A1A plus 10% of the accent, a warmer card than the old 5% mix. */
export function controlGrey(accentHex: string): string {
  const n = parseInt(accentHex.slice(1), 16)
  const mix = (c: number) => Math.round(0x1A * 0.9 + c * 0.1).toString(16).padStart(2, '0')
  return '#' + mix((n >> 16) & 255) + mix((n >> 8) & 255) + mix(n & 255)
}

/** The progress bars' empty track, borders and dots in dark mode: 95% of #383838 plus 5% of the accent. */
export function trackGrey(accentHex: string): string {
  const n = parseInt(accentHex.slice(1), 16)
  const mix = (c: number) => Math.round(0x38 * 0.95 + c * 0.05).toString(16).padStart(2, '0')
  return '#' + mix((n >> 16) & 255) + mix((n >> 8) & 255) + mix(n & 255)
}

/** A neutral grey of the given level with 5% of the accent mixed in. */
function tint(level: number, accentHex: string): string {
  const n = parseInt(accentHex.slice(1), 16)
  const mix = (c: number) => Math.round(level * 0.95 + c * 0.05).toString(16).padStart(2, '0')
  return '#' + mix((n >> 16) & 255) + mix((n >> 8) & 255) + mix(n & 255)
}

/** Dark-mode text: main text is a near-white (#EEEEEE), small text a mid grey (#999999), both with 5% accent. */
export const darkText = (accentHex: string) => tint(0xEE, accentHex)
export const darkDim = (accentHex: string) => tint(0x99, accentHex)
/** Dark-mode "well" (icon buttons, tonal buttons, wheel band): a dark grey (#131313) a step below the cards, plus 5% accent. */
export const darkWell = (accentHex: string) => tint(0x13, accentHex)

/** The accent as text on the light theme: darkened until it reaches 4.5:1 on the light background. (Dark mode uses the accent itself, which already passes.) */
export const ACCENT_TEXT_LIGHT: Record<string, string> = {
  violet: '#7960C3',
  teal: '#207E6E',
  amber: '#91692F',
  coral: '#B4523E',
}

/** Puts the chosen accent and light/dark mode on the page and tells the app so the system bars follow. */
export function applyTheme(accent: string, isDark: boolean): void {
  const root = document.documentElement
  root.setAttribute('data-prefers-color-scheme', isDark ? 'dark' : 'light')
  const color = ACCENTS[accent] ?? ACCENTS.violet
  root.style.setProperty('--accent', color)
  // Ant Design Mobile sets its own primary under the dark selector, which beats a stylesheet rule,
  // so the accent is also written inline where it always wins.
  root.style.setProperty('--adm-color-primary', color)
  root.style.setProperty('--adm-color-text-light-solid', '#0B0814')
  let bg = LIGHT_BG
  if (isDark) {
    bg = darkBackground(color)
    root.style.setProperty('--bg', bg)
    root.style.setProperty('--outer', bg)
    const grey = controlGrey(color)
    for (const v of ['--menu-bg', '--ring-track', '--pause-bg', '--surface']) root.style.setProperty(v, grey)
    root.style.setProperty('--track', trackGrey(color))
    root.style.setProperty('--text', darkText(color))
    root.style.setProperty('--dim', darkDim(color))
    root.style.setProperty('--well', darkWell(color))
    root.style.setProperty('--accent-text', color)
  } else {
    root.style.setProperty('--accent-text', ACCENT_TEXT_LIGHT[accent] ?? ACCENT_TEXT_LIGHT.violet)
    // the stylesheet's light values apply
    for (const v of ['--bg', '--outer', '--menu-bg', '--ring-track', '--pause-bg', '--surface', '--track', '--text', '--dim', '--well']) root.style.removeProperty(v)
  }
  try { api.setChrome(bg, !isDark) } catch { /* no system bars to tint in a browser */ }
}
