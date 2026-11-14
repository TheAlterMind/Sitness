// Shapes of the JSON the native side returns. See NativeBridge.kt.

export interface Level {
  level: number
  title: string
  into: number
  span: number
  nextTitle: string
  toNext: number
}

export type Flow = 'idle' | 'break' | 'water' | 'reward'

export interface AppState {
  now: number
  flow: Flow
  enabled: boolean
  paused: boolean
  pausedUntil?: number
  inWindow: boolean
  nextDue: number
  intervalMs: number
  windowStart: number
  use24h: boolean
  xp: number
  level: Level
  today: { completed: number; goal: number; water: number; waterGoal: number }
  combo: number
  streak: number
  showLine: boolean
  pending: boolean
  notificationsOff: boolean
  exactAlarmOff: boolean
  accent: string
  isDark: boolean
}

export interface ExerciseInfo {
  id: string
  name: string
  category: string
  instruction: string
  manualOnly: boolean
  inPool: boolean
  today: number
  total: number
}

export interface BreakInfo {
  stage: '' | 'break' | 'water' | 'reward'
  totalMs: number
  elapsedMs: number
  running: boolean
  exerciseId: string
  exercises: ExerciseInfo[]
  elapsedSeconds: number
  defaultGlasses: number
  waterToday: number
  waterGoal: number
}

export interface Reward {
  xp: number
  /** "label|value" rows */
  lines: string[]
  levelBefore: number
  goalHit: boolean
  badges: string[]
  elapsed: number
  exerciseId: string
  glasses: number
  level: Level
}

export interface BadgeInfo {
  id: string
  name: string
  description: string
  /** Epoch ms, 0 if still locked */
  unlockedAt: number
}

export interface Stats {
  xp: number
  level: Level
  totalBreaks: number
  minutes: number
  streak: number
  bestStreak: number
  bestCombo: number
  glasses: number
  activeDays: number
  badgeCount: number
  rate30: number | null
  last7: { key: string; completed: number }[]
  exercises: { id: string; name: string; manualOnly: boolean; inPool: boolean; total: number; upNext: boolean }[]
  badges: BadgeInfo[]
}

export interface Settings {
  enabled: boolean
  interval_minutes: number
  break_minutes: number
  day_start: number
  day_end: number
  active_days: string[]
  sound_enabled: boolean
  sound_kind: string
  vibrate_enabled: boolean
  vibrate_pattern: string
  fullscreen_enabled: boolean
  nudge_enabled: boolean
  nudge_after: number
  nudge_max: number
  snooze_minutes: number
  snooze_max: number
  auto_start_timer: boolean
  keep_screen_awake: boolean
  exercise_pool: string[]
  rotation: string
  reset_rotation_daily: boolean
  track_water: boolean
  default_glasses: number
  water_goal: number
  daily_goal: number
  streak_grace: number
  difficulty: string
  full_duration_bonus: boolean
  theme: string
  accent: string
  time_format: string
  show_contextual_line: boolean
}

export type SettingKey = keyof Settings
