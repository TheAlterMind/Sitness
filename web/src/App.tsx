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
const TAB_KEY = 'sitness.tab'

function savedTab(): Tab {
  try {
    const t = localStorage.getItem(TAB_KEY)
    if (t === 'stats' || t === 'settings') return t
  } catch { /* storage unavailable */ }
  return 'home'
}

export function App() {
  const [state, refresh] = usePoll(api.getState, 1000)
  const [tab, setTab] = useState<Tab>(savedTab)

  const choose = (t: Tab) => {
    setTab(t)
    try { localStorage.setItem(TAB_KEY, t) } catch { /* storage unavailable */ }
  }

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

  return (
    <div className="app">
      <main className="main">
        {tab === 'home' && <Home state={state} refresh={refresh} onOpen={choose} />}
        {tab === 'stats' && <Stats onBack={() => choose('home')} />}
        {tab === 'settings' && <SettingsScreen onChanged={refresh} onBack={() => choose('home')} />}
      </main>
    </div>
  )
}
