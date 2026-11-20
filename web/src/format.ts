import type { AppState } from './types'

export const pad2 = (n: number) => String(n).padStart(2, '0')

/** mm:ss from milliseconds, rounding up so a fresh 5:00 timer reads 05:00 for its first second. */
export function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`
}

/** Minute of day as "09:00" or "9:00 AM". */
export function minuteOfDay(min: number, use24h: boolean): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (use24h) return `${pad2(h)}:${pad2(m)}`
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${pad2(m)} ${h >= 12 ? 'PM' : 'AM'}`
}

/**
 * The break times in one day: the window opens at [start] and a break is due every [interval]
 * minutes until it closes. Mirrors ScheduleMath.kt, which is what really schedules them.
 */
export function daySlots(start: number, end: number, interval: number): number[] {
  const out: number[] = []
  if (interval <= 0) return out
  const last = start === end ? 24 * 60 - 1 : end > start ? end : end + 24 * 60
  const first = start === end ? 0 : start
  for (let m = first; m <= last; m += interval) out.push(m % (24 * 60))
  return out
}

/** The line under the countdown: whatever matters most right now. */
export function subtitle(s: AppState): string {
  if (!s.inWindow) return 'outside your hours'
  if (!s.showLine) return 'until next break'
  const { completed, goal } = s.today
  const nextTitleDiffers = s.level.nextTitle !== s.level.title
  if (completed >= goal) return 'daily goal reached, nicely done'
  if (s.combo >= 3) return `you're on a ${s.combo}-break combo`
  if (s.level.toNext <= 40 && nextTitleDiffers) return `${s.level.toNext} XP from ${s.level.nextTitle}`
  if (s.level.toNext <= 40) return `${s.level.toNext} XP to level ${s.level.level + 1}`
  if (s.streak > 0) return `${goal - completed} more ${goal - completed === 1 ? 'break' : 'breaks'} to keep your streak`
  return 'until next break'
}

/** "Mon", "Tue"… letter for a yyyy-MM-dd key. */
export function weekdayLetter(key: string): string {
  return new Date(`${key}T00:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })
}
