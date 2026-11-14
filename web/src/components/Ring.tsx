/** The home countdown: one arc filling toward the next break. */
export function Ring({ progress }: { progress: number }) {
  const r = 45
  const circ = 2 * Math.PI * r
  const p = Math.min(1, Math.max(0, progress))
  return (
    <svg viewBox="0 0 100 100" className="ring" role="img" aria-label="Time until the next break">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--ring-track)" strokeWidth="7" />
      {p > 0 && (
        <circle
          cx="50" cy="50" r={r} fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={`${circ * p} ${circ}`} transform="rotate(-90 50 50)"
        />
      )}
    </svg>
  )
}
