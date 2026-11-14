import type { ReactNode } from 'react'

/** A daily counter as a chip: icon and number. A soft accent tint fills the chip as the goal gets closer and stays soft when it is reached. */
export function ChipCounter({ icon, label, value, goal }: { icon: ReactNode; label: string; value: number; goal: number }) {
  if (goal <= 0) return null
  const pct = Math.min(100, Math.round((value / goal) * 100))
  return (
    <div
      className="chip-counter"
      role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={goal} aria-valuenow={value}
    >
      <span className="chip-tint" style={{ width: `${pct}%` }} />
      <span className="chip-icon">{icon}</span>
      <span className="chip-num">{value}</span>
    </div>
  )
}
