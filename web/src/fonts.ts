// The typeface choices. The app has no network permission, so these are fonts that ship with the
// device: Android's named system families first, then common desktop equivalents so the browser
// preview shows something close. How a font looks therefore depends a little on the device.

const KEY = 'sitness.font'

export const FONT_CHOICES: { label: string; value: string; stack: string }[] = [
  { label: 'System default', value: 'system', stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  { label: 'Roboto', value: 'roboto', stack: "Roboto, 'Segoe UI', Arial, sans-serif" },
  { label: 'Light', value: 'light', stack: "'sans-serif-light', 'Segoe UI Light', 'Helvetica Neue', Roboto, sans-serif" },
  { label: 'Medium', value: 'medium', stack: "'sans-serif-medium', 'Segoe UI Semibold', Roboto, sans-serif" },
  { label: 'Condensed', value: 'condensed', stack: "'sans-serif-condensed', 'Arial Narrow', Roboto, sans-serif" },
  { label: 'Serif', value: 'serif', stack: "serif, Georgia, 'Times New Roman'" },
  { label: 'Monospace', value: 'mono', stack: "monospace, Consolas, 'Courier New'" },
  { label: 'Serif monospace', value: 'serif-mono', stack: "'serif-monospace', 'Courier New', monospace" },
  { label: 'Casual', value: 'casual', stack: "casual, 'Comic Sans MS', 'Segoe Print', sans-serif" },
  { label: 'Cursive', value: 'cursive', stack: "cursive, 'Segoe Script', 'Brush Script MT', sans-serif" },
]

export function getUserFont(): string {
  try {
    const v = localStorage.getItem(KEY)
    if (FONT_CHOICES.some(c => c.value === v)) return v as string
  } catch { /* storage unavailable */ }
  return 'system'
}

export function applyFont(): void {
  const choice = FONT_CHOICES.find(c => c.value === getUserFont()) ?? FONT_CHOICES[0]
  document.documentElement.style.setProperty('--adm-font-family', choice.stack)
}

export function setUserFont(v: string): void {
  try { localStorage.setItem(KEY, v) } catch { /* storage unavailable */ }
  applyFont()
}
