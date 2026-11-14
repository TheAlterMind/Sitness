import type { SettingKey, Settings } from './types'

export interface Option { label: string; value: string }

interface Base {
  title: string
  desc?: string
  /** Greyed out unless this boolean setting is on. */
  dependsOn?: SettingKey
}

export type Item =
  | (Base & { kind: 'switch'; key: SettingKey })
  | (Base & { kind: 'slider'; key: SettingKey; min: number; max: number; step?: number; unit?: string })
  | (Base & { kind: 'select'; key: SettingKey; options: Option[] })
  | (Base & { kind: 'time'; key: SettingKey })
  | (Base & { kind: 'multi'; key: SettingKey; options: Option[]; columns?: number })
  | (Base & { kind: 'action'; id: ActionId })

export type ActionId = 'exact_alarm' | 'battery' | 'notifications' | 'export' | 'reset_stats' | 'reset_settings'

export interface Group { title: string; items: Item[] }

export const EXERCISE_OPTIONS: Option[] = [
  { label: '10 squats', value: 'squats' },
  { label: '250 steps', value: 'steps' },
  { label: 'Wall sit for a minute', value: 'wallsit' },
  { label: 'Lie on a hard flat surface', value: 'floor' },
  { label: '10 kickbacks', value: 'kickbacks' },
  { label: 'Assorted stretches', value: 'fascia' },
]

const DAYS: Option[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, i) => ({ label, value: String(i + 1) }))

export const GROUPS: Group[] = [
  {
    title: 'Rhythm',
    items: [
      { kind: 'switch', key: 'enabled', title: 'Reminders on', desc: 'Turns the whole schedule on or off' },
      { kind: 'slider', key: 'interval_minutes', title: 'Remind me every', desc: 'Breaks land on fixed times, counted from your start of day', min: 5, max: 180, step: 5, unit: 'min' },
      { kind: 'slider', key: 'break_minutes', title: 'Break length', desc: 'Minutes per break', min: 1, max: 30, unit: 'min' },
      { kind: 'time', key: 'day_start', title: 'Start of day' },
      { kind: 'time', key: 'day_end', title: 'End of day', desc: 'Same as the start means all day' },
      { kind: 'multi', key: 'active_days', title: 'Active days', desc: 'Days the schedule runs', options: DAYS, columns: 4 },
    ],
  },
  {
    title: 'How it alerts you',
    items: [
      { kind: 'switch', key: 'sound_enabled', title: 'Play a sound' },
      { kind: 'select', key: 'sound_kind', title: 'Sound', dependsOn: 'sound_enabled', options: [
        { label: 'Notification tone', value: 'notification' }, { label: 'Alarm tone (loud)', value: 'alarm' }, { label: 'Ringtone', value: 'ringtone' }] },
      { kind: 'switch', key: 'vibrate_enabled', title: 'Vibrate' },
      { kind: 'select', key: 'vibrate_pattern', title: 'Vibration pattern', dependsOn: 'vibrate_enabled', options: [
        { label: 'Short buzz', value: 'short' }, { label: 'Long buzz', value: 'long' }, { label: 'Pulse', value: 'pulse' }] },
      { kind: 'switch', key: 'fullscreen_enabled', title: 'Take over the screen', desc: 'Open the break screen straight away instead of only notifying' },
      { kind: 'switch', key: 'nudge_enabled', title: 'Nudge me if I ignore it' },
      { kind: 'slider', key: 'nudge_after', title: 'Nudge after', desc: 'Minutes to wait before nudging', dependsOn: 'nudge_enabled', min: 1, max: 30, unit: 'min' },
      { kind: 'slider', key: 'nudge_max', title: 'Maximum nudges', dependsOn: 'nudge_enabled', min: 0, max: 5 },
      { kind: 'slider', key: 'snooze_minutes', title: 'Snooze length', desc: 'Minutes added when you snooze', min: 1, max: 60, unit: 'min' },
      { kind: 'slider', key: 'snooze_max', title: 'Snoozes allowed', desc: 'After this many, the break counts as skipped', min: 0, max: 10 },
    ],
  },
  {
    title: 'During the break',
    items: [
      { kind: 'switch', key: 'auto_start_timer', title: 'Start the timer automatically', desc: 'Off means you tap play when you are ready' },
      { kind: 'switch', key: 'keep_screen_awake', title: 'Keep the screen awake' },
      { kind: 'multi', key: 'exercise_pool', title: 'Exercises in rotation', desc: 'Which movements the app can offer', options: EXERCISE_OPTIONS, columns: 1 },
      { kind: 'select', key: 'rotation', title: 'Which one comes up', options: [
        { label: 'Whichever you have done least', value: 'least' }, { label: 'Random each time', value: 'random' }] },
      { kind: 'switch', key: 'reset_rotation_daily', title: 'Reset the rotation daily', desc: "Off counts all-time totals instead of today's" },
    ],
  },
  {
    title: 'Water',
    items: [
      { kind: 'switch', key: 'track_water', title: 'Track water', desc: 'Off skips the water screen entirely' },
      { kind: 'slider', key: 'default_glasses', title: 'Starting count', desc: 'What the water screen opens on', dependsOn: 'track_water', min: 0, max: 4 },
      { kind: 'slider', key: 'water_goal', title: 'Daily water goal', dependsOn: 'track_water', min: 0, max: 20 },
    ],
  },
  {
    title: 'Goals and scoring',
    items: [
      { kind: 'slider', key: 'daily_goal', title: 'Breaks per day', desc: 'Hitting this keeps your streak alive', min: 1, max: 24 },
      { kind: 'slider', key: 'streak_grace', title: 'Streak grace days', desc: 'Active days you can miss before the streak resets', min: 0, max: 3 },
      { kind: 'select', key: 'difficulty', title: 'Scoring difficulty', options: [
        { label: 'Casual (0.8x XP)', value: 'casual' }, { label: 'Standard (1.0x XP)', value: 'standard' }, { label: 'Hardcore (1.3x XP)', value: 'hardcore' }] },
      { kind: 'switch', key: 'full_duration_bonus', title: 'Bonus for the full duration', desc: 'Worth 5 XP' },
    ],
  },
  {
    title: 'Appearance',
    items: [
      { kind: 'select', key: 'theme', title: 'Theme', options: [
        { label: 'Follow system', value: 'system' }, { label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }] },
      { kind: 'select', key: 'accent', title: 'Accent colour', options: [
        { label: 'Violet', value: 'violet' }, { label: 'Teal', value: 'teal' }, { label: 'Amber', value: 'amber' }, { label: 'Coral', value: 'coral' }] },
      { kind: 'select', key: 'time_format', title: 'Time format', options: [
        { label: '24-hour', value: '24' }, { label: '12-hour', value: '12' }] },
      { kind: 'switch', key: 'show_contextual_line', title: 'Show the contextual line', desc: 'Streak and combo prompts under the countdown' },
    ],
  },
  {
    title: 'Reliability',
    items: [
      { kind: 'action', id: 'exact_alarm', title: 'Alarms and reminders', desc: 'Allow exact timing so breaks land on the minute' },
      { kind: 'action', id: 'battery', title: 'Battery optimisation', desc: 'Stop Android sleeping the app and delaying reminders' },
      { kind: 'action', id: 'notifications', title: 'Notification settings', desc: 'Volume, importance and Do Not Disturb behaviour' },
    ],
  },
  {
    title: 'Data',
    items: [
      { kind: 'action', id: 'export', title: 'Export statistics as JSON', desc: 'Share a copy of your history' },
      { kind: 'action', id: 'reset_stats', title: 'Reset statistics' },
      { kind: 'action', id: 'reset_settings', title: 'Reset settings' },
    ],
  },
]

export const labelFor = (item: Extract<Item, { kind: 'select' }>, s: Settings): string =>
  item.options.find(o => o.value === String(s[item.key]))?.label ?? String(s[item.key])
