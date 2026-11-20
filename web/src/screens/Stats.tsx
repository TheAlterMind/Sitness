import { useState } from 'react'
import { Button, Dialog, Grid, ProgressBar } from 'antd-mobile'
import { QuestionCircleOutline } from 'antd-mobile-icons'
import { api } from '../bridge'
import { friendlyError } from '../errors'
import { useSwipe } from '../swipe'
import { HelpSheet } from '../components/HelpSheet'
import { PageTitle } from '../components/PageTitle'
import { BarChart } from '../components/BarChart'
import { CheckCircleIcon } from '../components/Icons'
import { confirmResetStats } from '../resetStats'
import { weekdayLetter } from '../format'
import { usePoll } from '../hooks'

function Tile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="tile">
      <div className="stat">{value}</div>
      <div className="caption">{label}</div>
    </div>
  )
}

export function Stats({ onBack }: { onBack: () => void }) {
  const [s, refresh] = usePoll(api.getStats, null)
  const [helpOpen, setHelpOpen] = useState(false)
  // Stats sits left of Home, so the way back is a swipe towards the left.
  const swipe = useSwipe({ onLeft: onBack })
  if (!s) return <div className="page" />

  const maxTotal = Math.max(1, ...s.exercises.map(e => e.total))
  const unlockedDate = (ms: number) => new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

  const doExport = () => {
    try { api.exportStats() } catch (e) { Dialog.alert({ title: 'Export failed', content: friendlyError(e, 'export your statistics') }) }
  }

  const doReset = () => confirmResetStats(refresh)

  return (
    <div className="page scrolling wide" {...swipe}>
      <PageTitle onBack={onBack}>Statistics</PageTitle>

      <div className="stats-cols">
      <div className="stats-col">
      <section className="card hero">
        <div className="hero-top">
          {s.streak >= 2 ? <div className="roll">You're on a roll</div> : <div className="caption">CURRENT STREAK</div>}
          <button className="icon-btn" aria-label="How it works" onClick={() => setHelpOpen(true)}><QuestionCircleOutline /></button>
        </div>
        <div className="hero-row">
          <span className="hero-num">{s.streak}</span>
          <span className="hero-unit">{s.streak === 1 ? 'day' : 'days'}</span>          <span className="dim small hero-best">Best {s.bestStreak}</span>
        </div>
        <div className="title">Level {s.level.level} · {s.level.title}</div>
        <div className="dim small">{s.xp} XP total · {s.level.into} / {s.level.span} to level {s.level.level + 1}</div>
        <ProgressBar percent={s.level.span ? (s.level.into / s.level.span) * 100 : 0} className="level-bar" />
      </section>

      <section className="card">
        <div className="caption">AT A GLANCE</div>
        <Grid columns={3} gap={0}>
          <Grid.Item><Tile value={s.totalBreaks} label="BREAKS DONE" /></Grid.Item>
          <Grid.Item><Tile value={s.activeDays ? (s.totalBreaks / s.activeDays).toFixed(1) : '—'} label="AVG PER DAY" /></Grid.Item>
          <Grid.Item><Tile value={s.rate30 === null ? '—' : `${s.rate30}%`} label="30-DAY RATE" /></Grid.Item>
          <Grid.Item><Tile value={s.bestCombo} label="BEST COMBO" /></Grid.Item>
          <Grid.Item><Tile value={s.glasses} label="GLASSES" /></Grid.Item>
          <Grid.Item><Tile value={s.activeDays} label="ACTIVE DAYS" /></Grid.Item>
        </Grid>
      </section>

      <section className="card">
        <div className="caption">EXERCISE BALANCE</div>
        <div className="dim small gap-b">All-time totals. Each break opens on whichever you have done least today.</div>
        {s.exercises.map(e => {
          const note = !e.inPool ? ' · off' : e.manualOnly ? ' · swipe only' : e.upNext ? ' · up next' : ''
          return (
            <div className="bar-row" key={e.id}>
              <div className="row">
                <span className={e.upNext ? 'accent' : ''}>{e.name}{note}</span>
                <span className="dim small">{e.total}</span>
              </div>
              <div className="meter"><div className={'fill' + (e.upNext ? ' on' : '')} style={{ width: `${(e.total / maxTotal) * 100}%` }} /></div>
            </div>
          )
        })}
      </section>
      </div>

      <div className="stats-col">
      <section className="card">
        <div className="caption gap-b">LAST 7 DAYS</div>
        <BarChart values={s.last7.map(d => d.completed)} labels={s.last7.map(d => weekdayLetter(d.key))} />
      </section>

      <section className="card">
        <div className="caption">BADGES</div>
        <div className="dim small gap-b">{s.badgeCount} of {s.badges.length}</div>
        {s.badges.map(b => {
          const got = b.unlockedAt > 0
          return (
            <div className="badge-row" key={b.id}>
              <span className={got ? 'badge-mark earned' : 'badge-mark'} aria-hidden="true">
                {got ? <CheckCircleIcon size={18} /> : <span className="badge-empty" />}
              </span>
              <div>
                <div className={got ? 'accent strong' : 'dim'}>{b.name}<span className="sr-only">{got ? ', earned' : ', locked'}</span></div>
                <div className="dim small">{b.description}{got ? `  ·  ${unlockedDate(b.unlockedAt)}` : ''}</div>
              </div>
            </div>
          )
        })}
      </section>
      </div>
      </div>

      <div className="stats-actions">
        <Button block size="large" className="tonal" onClick={doExport}>Export statistics as JSON</Button>
        <Button block fill="none" color="danger" onClick={doReset}>Reset all statistics</Button>
      </div>

      <HelpSheet visible={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
