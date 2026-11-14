import { useEffect, useState } from 'react'
import { Button, ProgressBar, Toast } from 'antd-mobile'
import { api } from '../bridge'
import { friendlyError } from '../errors'
import { CheckCircleIcon } from '../components/Icons'
import { useCountUp, usePoll } from '../hooks'

export function Reward({ refresh }: { refresh: () => void }) {
  const [reward] = usePoll(api.getReward, null)
  const [stats] = usePoll(api.getStats, null)
  const [bar, setBar] = useState(0)
  const xp = useCountUp(reward?.xp ?? 0)

  // Let the level bar start empty and slide to its value.
  useEffect(() => {
    if (!reward) return
    const t = window.setTimeout(() => setBar(reward.level.span > 0 ? (reward.level.into / reward.level.span) * 100 : 0), 220)
    return () => window.clearTimeout(t)
  }, [reward])

  if (!reward) return <div className="page" />

  const { level } = reward
  const levelledUp = level.level > reward.levelBefore
  const milestone = reward.lines.find(l => l.startsWith('Streak milestone'))
  const head = reward.xp === 0 ? 'Too quick to count'
    : milestone ? milestone.split('|')[0].replace('Streak milestone · ', '').replace(' days', '-day streak')
    : levelledUp ? `Level ${level.level} · ${level.title}`
    : reward.goalHit ? 'Daily goal reached' : 'Break done'

  const minutes = Math.max(1, Math.round(reward.elapsed / 60))
  const exName = stats?.exercises.find(e => e.id === reward.exerciseId)?.name ?? ''
  const sub = [`${minutes} min`, exName, reward.glasses > 0 ? `${reward.glasses} glass${reward.glasses > 1 ? 'es' : ''}` : '']
    .filter(Boolean).join(' · ')

  const badges = reward.badges
    .map(id => stats?.badges.find(b => b.id === id))
    .filter((b): b is NonNullable<typeof b> => !!b)

  const close = () => {
    try { api.closeReward() } catch (e) { Toast.show({ content: friendlyError(e, 'close this screen') }) }
    refresh()
  }

  return (
    <div className="page reward">
      <div className="scroll">
        <div className="reward-check"><CheckCircleIcon size={64} /></div>
        <h1 className="center">{head}</h1>
        <div className="dim center small">{sub}</div>
        <div className="xp">+{xp}</div>
        <div className="caption center">EXPERIENCE</div>

        <section className="card">
          {reward.lines.map((raw, i) => {
            const [label, value] = raw.split('|')
            return (
              <div className="line" key={i}>
                <span className="dim">{label}</span>
                <span>{value}</span>
              </div>
            )
          })}
        </section>

        <section className="card">
          <div className="row">
            <span>Level {level.level} · {level.title}</span>
            <span className="dim small">{level.into} / {level.span} XP</span>
          </div>
          <ProgressBar percent={bar} className="level-bar" />
        </section>

        {badges.map(b => (
          <section className="card badge-card" key={b.id}>
            <div className="category">BADGE UNLOCKED</div>
            <div className="badge-name">{b.name}</div>
            <div className="dim small">{b.description}</div>
          </section>
        ))}
      </div>

      <footer className="actions single">
        <Button color="primary" size="large" block onClick={close}>Done</Button>
      </footer>
    </div>
  )
}
