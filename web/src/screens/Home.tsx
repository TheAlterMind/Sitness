import { useRef } from 'react'
import { ActionSheet, Button, NoticeBar, Toast } from 'antd-mobile'
import { HistogramOutline, SetOutline } from 'antd-mobile-icons'
import { api } from '../bridge'
import { ClockIcon, CupIcon } from '../components/Icons'
import { ChipCounter } from '../components/ChipCounter'
import { Ring } from '../components/Ring'
import { clock, minuteOfDay, subtitle } from '../format'
import type { AppState } from '../types'

interface Props {
  state: AppState
  refresh: () => void
  onOpen: (screen: 'stats' | 'settings') => void
}

function attempt(fn: () => unknown, refresh: () => void) {
  try { fn() } catch (e) { Toast.show({ icon: 'fail', content: (e as Error).message }) }
  refresh()
}

function pausedUntilText(until: number, use24h: boolean): string {
  const end = new Date(until)
  if (end.toDateString() !== new Date().toDateString()) return 'until tomorrow'
  return `until ${minuteOfDay(end.getHours() * 60 + end.getMinutes(), use24h)}`
}

export function Home({ state: s, refresh, onOpen }: Props) {
  const remaining = Math.max(0, s.nextDue - Date.now())
  const hasDue = s.nextDue > 0
  const progress = hasDue ? Math.min(1, Math.max(0, (s.intervalMs - remaining) / s.intervalMs)) : 0

  let timer: string
  let sub: string
  let ring = progress
  if (!s.enabled) { timer = 'Off'; sub = 'reminders disabled'; ring = 0 }
  else if (s.paused) { timer = 'Paused'; sub = s.pausedUntil ? pausedUntilText(s.pausedUntil, s.use24h) : 'tap resume to restart' }
  else if (!s.inWindow) { timer = 'Off hours'; sub = `next break at ${minuteOfDay(s.windowStart, s.use24h)}`; ring = 0 }
  else { timer = hasDue ? clock(remaining) : '--:--'; sub = subtitle(s) }

  const pauseMenu = () => {
    const pick = (kind: '30' | '60' | '120' | 'day') => () => { handler.close(); attempt(() => api.pauseReminders(kind), refresh) }
    const handler = ActionSheet.show({
      cancelText: 'Cancel',
      actions: [
        { text: '30 minutes', key: '30', onClick: pick('30') },
        { text: '1 hour', key: '60', onClick: pick('60') },
        { text: '2 hours', key: '120', onClick: pick('120') },
        { text: 'Rest of today', key: 'day', onClick: pick('day') },
        {
          text: 'Turn off reminders', key: 'off', danger: true, description: 'Nothing until you turn them back on',
          onClick: () => {
            handler.close()
            attempt(() => {
              api.setEnabled(false)
              Toast.show({ content: 'Reminders are off. Tap Turn on to start again.' })
            }, refresh)
          },
        },
      ],
    })
  }

  const fixAlerts = () => {
    try {
      if (s.notificationsOff) api.openSystem('notifications')
      else api.openSystem('exact_alarm')
    } catch (e) { Toast.show({ content: (e as Error).message }) }
  }

  // Swipe right for Stats, swipe left for Settings (the header icons are hard to reach one-handed).
  // Starts near a screen edge are left alone: Android uses those for its own back gesture.
  const swipe = useRef<{ x: number; y: number; t: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    const p = e.touches[0]
    const edge = 24
    swipe.current = e.touches.length === 1 && p.clientX > edge && p.clientX < window.innerWidth - edge
      ? { x: p.clientX, y: p.clientY, t: Date.now() }
      : null
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = swipe.current
    swipe.current = null
    if (!s) return
    const p = e.changedTouches[0]
    const dx = p.clientX - s.x
    const dy = p.clientY - s.y
    if (Date.now() - s.t > 700 || Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    onOpen(dx < 0 ? 'settings' : 'stats')
  }

  return (
    <div className="page home" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={() => { swipe.current = null }}>
      <div className="home-top">
      <header className="head">
        <div>
          <div className="title">Level {s.level.level} · <span style={{ color: 'var(--accent-text)' }}>{s.level.title}</span></div>
        </div>
        <div className="head-icons">
          <button className="icon-btn" aria-label="Stats" onClick={() => onOpen('stats')}><HistogramOutline /></button>
          <button className="icon-btn" aria-label="Settings" onClick={() => onOpen('settings')}><SetOutline /></button>
        </div>
      </header>

      {(s.notificationsOff || s.exactAlarmOff) && (
        <NoticeBar
          className="notice"
          color="alert"
          wrap
          content={s.notificationsOff
            ? "Notifications are off, so reminders can't reach you. Tap to fix."
            : 'Reminders may be delayed. Tap to fix.'}
          onClick={fixAlerts}
        />
      )}

      </div>

      <section className="ring-area">
        <div className="counters">
          <ChipCounter icon={<ClockIcon size={20} />} label="Breaks today" value={s.today.completed} goal={s.today.goal} />
          <ChipCounter icon={<CupIcon size={20} />} label="Water today" value={s.today.water} goal={s.today.waterGoal} />
        </div>
        <div className="ring-box">
          <Ring progress={ring} />
          <div className="ring-center">
            <div className={timer.length > 6 ? 'timer long' : 'timer'}>{timer}</div>
            <div className="subtitle">{sub}</div>
          </div>
        </div>
      </section>

      <footer className="actions">
        <Button color="primary" size="large" block onClick={() => attempt(() => api.startBreak(), refresh)}>
          Break now
        </Button>
        <Button
          size="large" block className="tonal pause"
          onClick={() => (!s.enabled ? attempt(() => api.setEnabled(true), refresh) : s.paused ? attempt(() => api.resumeReminders(), refresh) : pauseMenu())}
        >
          {!s.enabled ? 'Turn on' : s.paused ? 'Resume' : 'Pause'}
        </Button>
      </footer>
    </div>
  )
}
