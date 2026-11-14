import { useEffect, useRef, useState } from 'react'
import { api } from './bridge'
import { usePoll } from './hooks'
import { applyTheme } from './theme'
import { Break, confirmSkip } from './screens/Break'
import { Home } from './screens/Home'
import { Reward } from './screens/Reward'
import { SettingsScreen } from './screens/Settings'
import { Stats } from './screens/Stats'
import { Water } from './screens/Water'

type Tab = 'home' | 'stats' | 'settings'
/** Where each screen "sits": Stats to the left of Home, Settings to the right (the header icons show the same order). */
const POSITION: Record<Tab, number> = { stats: 0, home: 1, settings: 2 }
const SLIDE_MS = 320
const TAB_KEY = 'sitness.tab'
/** A saved Stats or Settings screen is only restored if it was left this recently (a rotation or a quick app switch). Otherwise the app opens on Home. */
const TAB_RESTORE_MS = 2 * 60 * 1000

function savedTab(): Tab {
  try {
    const saved = JSON.parse(localStorage.getItem(TAB_KEY) ?? 'null') as { tab?: string; at?: number } | null
    if (saved && (saved.tab === 'stats' || saved.tab === 'settings') && typeof saved.at === 'number' && Date.now() - saved.at < TAB_RESTORE_MS) return saved.tab
  } catch { /* storage unavailable or an old value: open on Home */ }
  return 'home'
}

export function App() {
  const [state, refresh] = usePoll(api.getState, 1000)
  const [tab, setTab] = useState<Tab>(savedTab)

  // The screen that is leaving, and the side the new one comes in from. The new screen always enters from the
  // side where it sits, and the old one leaves towards the opposite side, whatever caused the switch.
  const [slide, setSlide] = useState<{ from: Tab; enter: 'left' | 'right' } | null>(null)
  const slideTimer = useRef<number>()

  const choose = (t: Tab) => {
    if (t !== tab && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setSlide({ from: tab, enter: POSITION[t] > POSITION[tab] ? 'right' : 'left' })
      window.clearTimeout(slideTimer.current)
      slideTimer.current = window.setTimeout(() => setSlide(null), SLIDE_MS)
    }
    setTab(t)
    try { localStorage.setItem(TAB_KEY, JSON.stringify({ tab: t, at: Date.now() })) } catch { /* storage unavailable */ }
  }

  // While a sub-screen is open, keep refreshing the saved time, so "left recently" means the page was still alive a moment ago,
  // not how long ago the screen was opened.
  useEffect(() => {
    if (tab === 'home') return
    const save = () => { try { localStorage.setItem(TAB_KEY, JSON.stringify({ tab, at: Date.now() })) } catch { /* storage unavailable */ } }
    const id = window.setInterval(save, 5000)
    return () => window.clearInterval(id)
  }, [tab])

  // Follow the user's accent and light/dark choice (the native side resolves "system").
  useEffect(() => {
    if (state) applyTheme(state.accent, state.isDark)
  }, [state?.accent, state?.isDark])

  // Back: leave a sub-screen, or confirm before abandoning a break. Anything else exits the app.
  const flow = state?.flow ?? 'idle'
  const backRef = useRef<() => boolean>(() => false)
  backRef.current = () => {
    if (flow === 'break') { confirmSkip(refresh); return true }
    if (flow === 'idle' && tab !== 'home') { choose('home'); return true }
    return false
  }
  useEffect(() => {
    window.nativeBack = () => backRef.current()
    window.nativeResume = () => window.dispatchEvent(new Event('sitness:resume'))
    return () => { window.nativeBack = undefined; window.nativeResume = undefined }
  }, [])

  if (!state) return <div className="app"><div className="page" /></div>

  if (flow === 'break') return <div className="app"><Break refresh={refresh} /></div>
  if (flow === 'water') return <div className="app"><Water refresh={refresh} /></div>
  if (flow === 'reward') return <div className="app"><Reward refresh={refresh} /></div>

  const screen = (t: Tab) => {
    if (t === 'home') return <Home state={state} refresh={refresh} onOpen={choose} />
    if (t === 'stats') return <Stats onBack={() => choose('home')} />
    return <SettingsScreen onChanged={refresh} onBack={() => choose('home')} />
  }

  return (
    <div className="app">
      <main className={`main${slide ? ' sliding' : ''}`}>
        {slide && <div key={`out-${slide.from}`} className={`screen out-${slide.enter === 'right' ? 'left' : 'right'}`}>{screen(slide.from)}</div>}
        <div key={tab} className={`screen${slide ? ` in-${slide.enter}` : ''}`}>{screen(tab)}</div>
      </main>
    </div>
  )
}
