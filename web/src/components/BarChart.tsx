/** Seven-day bar chart for the statistics screen. */
export function BarChart({ values, labels }: { values: number[]; labels: string[] }) {
  const w = 280
  const h = 110
  const labelSpace = 22
  const chartH = h - labelSpace
  const max = Math.max(1, ...values)
  const slot = w / Math.max(1, values.length)
  const barW = slot * 0.6

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="bar-chart" role="img" aria-label="Breaks completed in the last seven days">
      {values.map((v, i) => {
        const cx = slot * i + slot / 2
        const bh = v > 0 ? Math.max(5, (chartH * 0.86 * v) / max) : 5
        return (
          <g key={i}>
            <rect x={cx - barW / 2} y={chartH - bh} width={barW} height={bh} rx={barW / 2.4}
              fill={v > 0 ? 'var(--accent)' : 'var(--track)'} />
            {v > 0 && (
              <text x={cx} y={chartH - bh - 4} textAnchor="middle" fontSize="10" fill="var(--dim)">{v}</text>
            )}
            <text x={cx} y={h - 6} textAnchor="middle" fontSize="11" fill="var(--dim)">{labels[i] ?? ''}</text>
          </g>
        )
      })}
    </svg>
  )
}
