// A stand-in for the Android bridge so the UI can be developed and checked in a plain browser.
// It mirrors what the Kotlin side returns; the numbers are made up and live only in memory.

import { daySlots } from './format'
import type { AppState, BadgeInfo, BreakInfo, ExerciseInfo, Level, Reward, SettingKey, Settings, Stats } from './types'

const EXERCISES = [
  { id: 'squats', name: '10 squats', category: 'strength', instruction: 'Feet shoulder-width. Sit back and down, chest up, heels planted.', manualOnly: false },
  { id: 'steps', name: '250 steps', category: 'cardio', instruction: 'Corridor, stairs, around the block. Anywhere but the chair.', manualOnly: false },
  { id: 'wallsit', name: 'Wall sit for a minute', category: 'strength', instruction: 'Back flat against the wall, thighs parallel to the floor. Breathe.', manualOnly: false },
  { id: 'floor', name: 'Lie on a hard flat surface', category: 'recovery', instruction: 'Flat on your back on the floor, arms at your sides. Let the spine settle.', manualOnly: true },
  { id: 'kickbacks', name: '10 kickbacks', category: 'strength', instruction: 'Hinge slightly, drive one heel back and up, squeeze. Swap legs.', manualOnly: false },
  { id: 'fascia', name: 'Assorted stretches', category: 'mobility', instruction: 'Slow, long holds. Find what feels bound and breathe into it.', manualOnly: false },
]

const BADGES = [
  ['first', 'Ice Breaker', 'Finish your first break'],
  ['ten', 'Getting Loose', 'Finish 10 breaks'],
  ['fifty', 'Habit Forming', 'Finish 50 breaks'],
  ['combo5', 'On a Roll', '5 breaks back to back'],
  ['combo10', 'Unbroken', '10 breaks back to back'],
  ['streak3', 'Three in a Row', 'Hit your goal 3 days running'],
  ['streak7', 'Full Week', 'Hit your goal 7 days running'],
  ['water', 'Well Watered', 'Hit your water goal in a day'],
  ['perfect', 'Clean Sheet', 'Every break in a day, none skipped'],
  ['hour', 'First Hour', '60 minutes of breaks in total'],
  ['rounded', 'Well Rounded', 'Try all six exercises'],
  ['floorbadge', 'Flat Out', 'Lie on the floor 10 times'],
] as const

const DEFAULTS: Settings = {
  enabled: true, interval_minutes: 60, break_minutes: 5, day_start: 595, day_end: 1075,
  active_days: ['2', '3', '4', '5', '6'],
  sound_enabled: true, sound_kind: 'notification', vibrate_enabled: true, vibrate_pattern: 'short',
  fullscreen_enabled: false, nudge_enabled: true, nudge_after: 5, nudge_max: 2, snooze_minutes: 10, snooze_max: 3,
  auto_start_timer: true, keep_screen_awake: true, exercise_pool: EXERCISES.map(e => e.id),
  rotation: 'least', reset_rotation_daily: true,
  track_water: true, default_glasses: 1, water_goal: 8,
  daily_goal: 8, streak_grace: 1, difficulty: 'standard', full_duration_bonus: true,
  theme: 'system', accent: 'violet', time_format: '24', show_contextual_line: true,
}

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const xpForLevel = (l: number) => 50 * (l - 1) * l
const levelFor = (xp: number) => { let l = 1; while (xpForLevel(l + 1) <= xp && l < 200) l++; return l }
const titleFor = (l: number) =>
  l < 2 ? 'Desk Dweller' : l < 4 ? 'Fidgeter' : l < 7 ? 'Stretcher' : l < 11 ? 'Mover' : l < 16 ? 'Strider'
    : l < 22 ? 'Pacer' : l < 30 ? 'Kinetic' : l < 40 ? 'Relentless' : 'Perpetual'

function levelJson(xp: number): Level {
  const level = levelFor(xp)
  return {
    level, title: titleFor(level), into: xp - xpForLevel(level), span: xpForLevel(level + 1) - xpForLevel(level),
    nextTitle: titleFor(level + 1), toNext: xpForLevel(level + 1) - xp,
  }
}

// ---- in-memory data ----
let settings: Settings = { ...DEFAULTS }
const profile = { xp: 180, totalBreaks: 18, totalSeconds: 5400, totalWater: 15, streak: 3, longestStreak: 5, combo: 2, bestCombo: 6 }
const exTotal: Record<string, number> = { squats: 5, steps: 4, wallsit: 3, floor: 1, kickbacks: 3, fascia: 2 }
const exDaily: Record<string, number> = { squats: 1, steps: 1 }
const unlocked: Record<string, number> = { first: Date.now() - 6 * 864e5, ten: Date.now() - 3 * 864e5, combo5: Date.now() - 2 * 864e5 }
const days: Record<string, { scheduled: number; completed: number; water: number; goalMet: boolean }> = {}
for (let i = 6; i >= 0; i--) {
  const d = new Date(); d.setDate(d.getDate() - i)
  const done = i === 0 ? 2 : [5, 8, 6, 7, 3, 8][i - 1] ?? 4
  days[dayKey(d)] = { scheduled: done + 1, completed: done, water: done, goalMet: done >= 8 }
}
const today = () => days[dayKey(new Date())]

let pausedUntil = 0
let armedDue = 0 // when the next break fires; 0 = work it out from the grid

/** The next break on the fixed grid (active days are ignored in the mock). */
function nextSlot(): number {
  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
  const slots = daySlots(settings.day_start, settings.day_end, settings.interval_minutes)
  const day = new Date(now)
  day.setHours(0, 0, 0, 0)
  const hit = slots.find(m => m > cur)
  if (hit !== undefined) { day.setMinutes(hit); return day.getTime() }
  day.setDate(day.getDate() + 1)
  day.setMinutes(slots[0] ?? 0)
  return day.getTime()
}

interface Session {
  stage: 'break' | 'water' | 'reward'
  exerciseId: string
  totalMs: number
  banked: number
  runStart: number // 0 = paused
  seconds: number
  full: boolean
  reward: Reward | null
}
let session: Session | null = null

const elapsedMs = (s: Session) => Math.min(s.totalMs, s.banked + (s.runStart ? Date.now() - s.runStart : 0))
const inPool = (id: string) => settings.exercise_pool.includes(id)

function exercisesJson(): ExerciseInfo[] {
  return EXERCISES.map(e => ({ ...e, inPool: inPool(e.id), today: exDaily[e.id] ?? 0, total: exTotal[e.id] ?? 0 }))
}

function suggest(): string {
  const cands = EXERCISES.filter(e => !e.manualOnly && inPool(e.id))
  if (!cands.length) return EXERCISES[0].id
  if (settings.rotation === 'random') return cands[Math.floor(Math.random() * cands.length)].id
  const count = (id: string) => (settings.reset_rotation_daily ? exDaily[id] : exTotal[id]) ?? 0
  const min = Math.min(...cands.map(e => count(e.id)))
  const least = cands.filter(e => count(e.id) === min)
  return least[Math.floor(Math.random() * least.length)].id
}

/** Starts a break, as the real app does. Does nothing if one is already open. */
function openBreak() {
  if (session) return
  session = {
    stage: 'break', exerciseId: suggest(), totalMs: settings.break_minutes * 60_000, banked: 0,
    runStart: settings.auto_start_timer ? Date.now() : 0, seconds: 0, full: false, reward: null,
  }
}

/**
 * Stands in for the alarm: when the countdown reaches zero the break starts by itself, the way the
 * real app opens it when it is in the foreground. Called whenever the page asks for the state.
 */
function tick() {
  const now = Date.now()
  if (armedDue && now >= armedDue) {
    armedDue = 0
    if (settings.enabled && pausedUntil <= now && !session) openBreak()
  }
  if (!armedDue) armedDue = nextSlot()
}

function stateJson(): AppState {
  tick()
  const now = Date.now()
  const t = today()
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  return {
    now, flow: session ? session.stage : 'idle', enabled: settings.enabled, paused: pausedUntil > now, pausedUntil,
    inWindow: true, nextDue: settings.enabled ? Math.max(armedDue, pausedUntil) : 0,
    intervalMs: settings.interval_minutes * 60_000, windowStart: settings.day_start, use24h: settings.time_format === '24',
    xp: profile.xp, level: levelJson(profile.xp),
    today: { completed: t.completed, goal: settings.daily_goal, water: t.water, waterGoal: settings.water_goal },
    combo: profile.combo, streak: profile.streak, showLine: settings.show_contextual_line, pending: false,
    notificationsOff: false, exactAlarmOff: false, accent: settings.accent, isDark: dark,
  }
}

function breakJson(): BreakInfo {
  if (!session) return { stage: '' } as BreakInfo
  return {
    stage: session.stage, totalMs: session.totalMs, elapsedMs: elapsedMs(session), running: session.runStart !== 0,
    exerciseId: session.exerciseId, exercises: exercisesJson(), elapsedSeconds: session.seconds,
    defaultGlasses: settings.default_glasses, waterToday: today().water, waterGoal: settings.water_goal,
  }
}

function commit(glasses: number): Reward {
  const s = session!
  const levelBefore = levelFor(profile.xp)
  const lines: string[] = []
  let earned = 0
  let goalHit = false
  const badges: string[] = []

  if (s.seconds < 30) {
    profile.combo = 0
    lines.push('Too quick to count|+0')
  } else {
    let base = 10
    lines.push('Break completed|+10')
    if (s.full && settings.full_duration_bonus) { base += 5; lines.push('Full duration|+5') }
    base += 5; lines.push('Exercised|+5')
    if (glasses > 0) { base += 4 * glasses; lines.push(`Water · ${glasses} glass${glasses > 1 ? 'es' : ''}|+${4 * glasses}`) }
    const combo = profile.combo + 1
    const cm = Math.min(2, 1 + 0.1 * Math.max(0, combo - 1))
    const dm = settings.difficulty === 'casual' ? 0.8 : settings.difficulty === 'hardcore' ? 1.3 : 1
    earned = Math.round(base * cm * dm)
    if (cm > 1) lines.push(`Combo x${combo}|x${cm.toFixed(1)}`)
    if (dm !== 1) lines.push(`Difficulty|x${dm}`)

    const t = today()
    t.completed++; t.water += glasses
    profile.xp += earned; profile.totalBreaks++; profile.totalSeconds += s.seconds; profile.totalWater += glasses
    profile.combo = combo; profile.bestCombo = Math.max(profile.bestCombo, combo)
    exTotal[s.exerciseId] = (exTotal[s.exerciseId] ?? 0) + 1
    exDaily[s.exerciseId] = (exDaily[s.exerciseId] ?? 0) + 1

    if (t.completed >= settings.daily_goal && !t.goalMet) {
      t.goalMet = true; profile.streak++; goalHit = true
      const streak = profile.streak
      const streakXp = Math.min(100, 5 * streak)
      const milestoneXp = ({ 7: 100, 30: 300, 100: 1000 } as Record<number, number>)[streak] ?? 0
      const bonus = 50 + streakXp + milestoneXp
      profile.xp += bonus; earned += bonus
      lines.push('Daily goal reached|+50')
      if (streakXp > 0) lines.push(`Streak · ${streak} day${streak > 1 ? 's' : ''}|+${streakXp}`)
      if (milestoneXp > 0) lines.push(`Streak milestone · ${streak} days|+${milestoneXp}`)
    }
    if (profile.totalBreaks >= 20 && !unlocked.ten) { unlocked.ten = Date.now(); badges.push('ten') }
    if (profile.combo >= 5 && !unlocked.combo5) { unlocked.combo5 = Date.now(); badges.push('combo5') }
  }

  const reward: Reward = {
    xp: earned, lines, levelBefore, goalHit, badges, elapsed: s.seconds, exerciseId: s.exerciseId, glasses,
    level: levelJson(profile.xp),
  }
  s.stage = 'reward'; s.reward = reward
  return reward
}

function statsJson(): Stats {
  const keys: { key: string; completed: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    keys.push({ key: dayKey(d), completed: days[dayKey(d)]?.completed ?? 0 })
  }
  const elig = EXERCISES.filter(e => !e.manualOnly && inPool(e.id))
  const cnt = (id: string) => (settings.reset_rotation_daily ? exDaily[id] : exTotal[id]) ?? 0
  const least = elig.length ? Math.min(...elig.map(e => cnt(e.id))) : 0
  const scheduled = Object.values(days).reduce((a, d) => a + d.scheduled, 0)
  const completed = Object.values(days).reduce((a, d) => a + d.completed, 0)
  const badges: BadgeInfo[] = BADGES.map(([id, name, description]) => ({ id, name, description, unlockedAt: unlocked[id] ?? 0 }))
  return {
    xp: profile.xp, level: levelJson(profile.xp), totalBreaks: profile.totalBreaks,
    minutes: Math.floor(profile.totalSeconds / 60), streak: profile.streak, bestStreak: profile.longestStreak,
    bestCombo: profile.bestCombo, glasses: profile.totalWater, activeDays: Object.keys(days).length,
    badgeCount: Object.keys(unlocked).length, rate30: scheduled ? Math.floor((completed * 100) / scheduled) : null,
    last7: keys,
    exercises: EXERCISES.map(e => ({
      id: e.id, name: e.name, manualOnly: e.manualOnly, inPool: inPool(e.id), total: exTotal[e.id] ?? 0,
      upNext: !e.manualOnly && inPool(e.id) && cnt(e.id) === least,
    })),
    badges,
  }
}

export function mockCall(method: string, a: unknown[]): unknown {
  switch (method) {
    case 'getState': return stateJson()
    case 'getBreak': return breakJson()
    case 'getReward': return session?.reward ?? null
    case 'getStats': return statsJson()
    case 'getSettings': return { ...settings }

    case 'setSetting': settings = { ...settings, [a[0] as SettingKey]: a[1] } as Settings; armedDue = 0; return { ...settings }
    case 'resetSettings': settings = { ...DEFAULTS }; armedDue = 0; return { ...settings }
    case 'resetStats': profile.xp = 0; profile.totalBreaks = 0; profile.totalSeconds = 0; profile.totalWater = 0
      profile.streak = 0; profile.longestStreak = 0; profile.combo = 0; profile.bestCombo = 0
      for (const k of Object.keys(unlocked)) delete unlocked[k]
      for (const k of Object.keys(exTotal)) exTotal[k] = 0
      return true

    case 'startBreak': openBreak(); return breakJson()
    case 'setExercise': if (session) session.exerciseId = a[0] as string; return true
    case 'togglePause': {
      const s = session
      if (s) { if (s.runStart) { s.banked = elapsedMs(s); s.runStart = 0 } else s.runStart = Date.now() }
      return breakJson()
    }
    case 'finishBreak': {
      const s = session!
      const ms = elapsedMs(s)
      s.seconds = Math.floor(ms / 1000); s.full = ms >= s.totalMs; s.banked = ms; s.runStart = 0
      if (settings.track_water) { s.stage = 'water'; return 'water' }
      commit(0); return 'reward'
    }
    case 'skipBreak': profile.combo = 0; session = null; return true
    case 'commitBreak': return commit(a[0] as number)
    case 'closeReward': session = null; return true

    case 'setEnabled': settings.enabled = a[0] as boolean; armedDue = 0; return true
    case 'pauseReminders': {
      const kind = a[0] as string
      // 'day' mirrors AlarmScheduler.pauseRestOfDay: 00:01 tomorrow
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 1, 0, 0)
      pausedUntil = kind === 'day' ? tomorrow.getTime() : Date.now() + Number(kind) * 60_000
      armedDue = 0
      return true
    }
    case 'resumeReminders': pausedUntil = 0; armedDue = 0; return true

    case 'exportStats': case 'openSystem': case 'requestNotificationPermission': case 'setChrome': return true
    // The browser has no system font setting; ?fs=1.3 in the address bar stands in for it when testing.
    case 'fontScale': return Number(new URLSearchParams(location.search).get('fs')) || 1

    default: throw new Error(`Unknown method: ${method}`)
  }
}
