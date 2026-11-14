import type { ReactNode } from 'react'

/** A small progress ring toward a daily goal, with its icon in the middle. */
export function CounterRing({ icon, label, value, goal }: { icon: ReactNode; label: string; value: number; goal: number }) {
  const r = 42
  const circ = 2 * Math.PI * r
  const p = goal > 0 ? Math.min(1, Math.max(0, value / goal)) : 0
  return (
    <div className="counter-ring" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={goal} aria-valuenow={value}>
      <svg viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--track)" strokeWidth="10" />
        {p > 0 && (
          <circle
            cx="50" cy="50" r={r} fill="none" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${circ * p} ${circ}`} transform="rotate(-90 50 50)" className="arc"
          />
        )}
      </svg>
      <span className="counter-ring-icon">{icon}</span>
      <span className="counter-ring-count" aria-hidden="true">{value}/{goal}</span>
    </div>
  )
}
