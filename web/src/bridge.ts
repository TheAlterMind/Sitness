import type { AppState, BreakInfo, Flow, Reward, SettingKey, Settings, Stats } from './types'

declare global {
  interface Window {
    /** Injected by the Android app (NativeBridge.kt). Absent in a plain browser. */
    Native?: { call(method: string, argsJson: string): string }
    /** Called by the app on Back. Return true if the page handled it. */
    nativeBack?: () => boolean
    /** Called by the app when the activity returns to the foreground. */
    nativeResume?: () => void
  }
}

type Envelope = { ok: true; data: unknown } | { ok: false; error: string }
type Impl = (method: string, args: unknown[]) => unknown

let impl: Impl = () => {
  throw new Error('Bridge not initialised')
}

/** Picks the Android bridge if there is one, otherwise a mock so the UI runs in a browser. */
export async function initBridge(): Promise<void> {
  if (window.Native) {
    const native = window.Native
    impl = (method, args) => {
      const env = JSON.parse(native.call(method, JSON.stringify(args))) as Envelope
      if (!env.ok) throw new Error(env.error)
      return env.data
    }
  } else {
    const { mockCall } = await import('./mock')
    impl = mockCall
  }
}

const call = <T>(method: string, ...args: unknown[]): T => impl(method, args) as T

export const api = {
  getState: () => call<AppState>('getState'),
  getBreak: () => call<BreakInfo>('getBreak'),
  getReward: () => call<Reward | null>('getReward'),
  getStats: () => call<Stats>('getStats'),
  getSettings: () => call<Settings>('getSettings'),

  setSetting: (key: SettingKey, value: unknown) => call<Settings>('setSetting', key, value),
  resetSettings: () => call<Settings>('resetSettings'),
  resetStats: () => call<boolean>('resetStats'),

  startBreak: () => call<BreakInfo>('startBreak'),
  setExercise: (id: string) => call<boolean>('setExercise', id),
  togglePause: () => call<BreakInfo>('togglePause'),
  finishBreak: () => call<Flow>('finishBreak'),
  skipBreak: () => call<boolean>('skipBreak'),
  commitBreak: (glasses: number) => call<Reward>('commitBreak', glasses),
  closeReward: () => call<boolean>('closeReward'),

  setEnabled: (on: boolean) => call<boolean>('setEnabled', on),
  pauseReminders: (kind: '30' | '60' | '120' | 'day') => call<boolean>('pauseReminders', kind),
  resumeReminders: () => call<boolean>('resumeReminders'),

  exportStats: () => call<boolean>('exportStats'),
  openSystem: (which: 'exact_alarm' | 'battery' | 'notifications') => call<boolean>('openSystem', which),
  requestNotificationPermission: () => call<boolean>('requestNotificationPermission'),
  setChrome: (hex: string, darkIcons: boolean) => call<boolean>('setChrome', hex, darkIcons),
}
