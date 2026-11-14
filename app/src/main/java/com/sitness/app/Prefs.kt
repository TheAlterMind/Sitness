package com.sitness.app

import android.content.Context
import android.content.SharedPreferences

/**
 * Every user-facing setting, with its default. The keys the web UI may change, and their
 * limits, are listed in [SettingsSpec].
 */
object Prefs {

    // Rhythm
    const val ENABLED = "enabled"
    const val INTERVAL = "interval_minutes"
    const val BREAK_MINUTES = "break_minutes"
    const val DAY_START = "day_start"
    const val DAY_END = "day_end"
    const val ACTIVE_DAYS = "active_days"

    // Alerts
    const val SOUND = "sound_enabled"
    const val SOUND_KIND = "sound_kind"
    const val VIBRATE = "vibrate_enabled"
    const val VIBE_KIND = "vibrate_pattern"
    const val FULLSCREEN = "fullscreen_enabled"
    const val NUDGE = "nudge_enabled"
    const val NUDGE_AFTER = "nudge_after"
    const val NUDGE_MAX = "nudge_max"
    const val SNOOZE = "snooze_minutes"
    const val SNOOZE_MAX = "snooze_max"

    // Break
    const val AUTO_START = "auto_start_timer"
    const val KEEP_AWAKE = "keep_screen_awake"
    const val POOL = "exercise_pool"
    const val ROTATION = "rotation"
    const val RESET_DAILY = "reset_rotation_daily"

    // Water
    const val TRACK_WATER = "track_water"
    const val DEFAULT_GLASSES = "default_glasses"
    const val WATER_GOAL = "water_goal"

    // Goals
    const val DAILY_GOAL = "daily_goal"
    const val GRACE = "streak_grace"
    const val DIFFICULTY = "difficulty"
    const val FULL_BONUS = "full_duration_bonus"

    // Appearance
    const val THEME = "theme"
    const val ACCENT = "accent"
    const val TIME_FORMAT = "time_format"
    const val SHOW_LINE = "show_contextual_line"

    // Runtime (not shown in settings)
    const val NEXT_DUE = "next_due"
    const val PAUSED_UNTIL = "paused_until"
    const val PENDING_SINCE = "pending_since"
    const val NUDGE_COUNT = "nudge_count"
    const val SNOOZE_COUNT = "snooze_count"
    const val PENDING_DAY = "pending_day"         // day key the unanswered break belongs to
    const val TIMING_SIG = "timing_signature"     // settings the stored alarm was computed from

    /** Same file the old preference screen used ("<package>_preferences"), so existing settings carry over. */
    fun sp(c: Context): SharedPreferences =
        c.applicationContext.getSharedPreferences(c.applicationContext.packageName + "_preferences", Context.MODE_PRIVATE)

    /** Allowed values, shared by the page's sliders (via SettingsSpec) and the reads below, so a value saved under older limits is brought back inside. */
    val INTERVAL_RANGE = 15..60
    val BREAK_RANGE = 1..15
    val SNOOZE_RANGE = 1..30

    fun enabled(c: Context) = sp(c).getBoolean(ENABLED, true)
    fun interval(c: Context) = sp(c).getInt(INTERVAL, 60).coerceIn(INTERVAL_RANGE)
    fun breakMinutes(c: Context) = sp(c).getInt(BREAK_MINUTES, 5).coerceIn(BREAK_RANGE)
    fun dayStart(c: Context) = sp(c).getInt(DAY_START, 9 * 60 + 55)    // 09:55
    fun dayEnd(c: Context) = sp(c).getInt(DAY_END, 17 * 60 + 55)       // 17:55

    fun activeDays(c: Context): Set<Int> {
        val def = setOf("2", "3", "4", "5", "6")
        val raw = sp(c).getStringSet(ACTIVE_DAYS, def) ?: def
        return raw.mapNotNull { it.toIntOrNull() }.toSet()
    }

    fun sound(c: Context) = sp(c).getBoolean(SOUND, true)
    fun soundKind(c: Context): String = sp(c).getString(SOUND_KIND, "notification") ?: "notification"
    fun vibrate(c: Context) = sp(c).getBoolean(VIBRATE, true)
    fun vibeKind(c: Context): String = sp(c).getString(VIBE_KIND, "short") ?: "short"
    fun fullscreen(c: Context) = sp(c).getBoolean(FULLSCREEN, false)
    fun nudge(c: Context) = sp(c).getBoolean(NUDGE, true)
    fun nudgeAfter(c: Context) = sp(c).getInt(NUDGE_AFTER, 5).coerceAtLeast(1)
    fun nudgeMax(c: Context) = sp(c).getInt(NUDGE_MAX, 2)
    fun snooze(c: Context) = sp(c).getInt(SNOOZE, 10).coerceIn(SNOOZE_RANGE)
    fun snoozeMax(c: Context) = sp(c).getInt(SNOOZE_MAX, 3)

    fun autoStart(c: Context) = sp(c).getBoolean(AUTO_START, true)
    fun keepAwake(c: Context) = sp(c).getBoolean(KEEP_AWAKE, true)

    fun pool(c: Context): Set<String> {
        val def = Exercises.IDS.toSet()
        val raw = sp(c).getStringSet(POOL, def) ?: def
        return if (raw.isEmpty()) def else raw
    }

    fun rotation(c: Context): String = sp(c).getString(ROTATION, "least") ?: "least"
    fun resetDaily(c: Context) = sp(c).getBoolean(RESET_DAILY, true)

    fun trackWater(c: Context) = sp(c).getBoolean(TRACK_WATER, true)
    fun defaultGlasses(c: Context) = sp(c).getInt(DEFAULT_GLASSES, 1)
    fun waterGoal(c: Context) = sp(c).getInt(WATER_GOAL, 8)

    fun dailyGoal(c: Context) = sp(c).getInt(DAILY_GOAL, 8).coerceAtLeast(1)
    fun grace(c: Context) = sp(c).getInt(GRACE, 1)
    fun difficulty(c: Context): String = sp(c).getString(DIFFICULTY, "standard") ?: "standard"
    fun fullBonus(c: Context) = sp(c).getBoolean(FULL_BONUS, true)

    fun theme(c: Context): String = sp(c).getString(THEME, "system") ?: "system"
    fun accent(c: Context): String = sp(c).getString(ACCENT, "violet") ?: "violet"
    fun use24h(c: Context) = (sp(c).getString(TIME_FORMAT, "24") ?: "24") == "24"
    fun showLine(c: Context) = sp(c).getBoolean(SHOW_LINE, true)

    fun nextDue(c: Context) = sp(c).getLong(NEXT_DUE, 0L)
    fun pausedUntil(c: Context) = sp(c).getLong(PAUSED_UNTIL, 0L)

    fun setLong(c: Context, k: String, v: Long) = sp(c).edit().putLong(k, v).apply()
    fun setInt(c: Context, k: String, v: Int) = sp(c).edit().putInt(k, v).apply()
    fun setBool(c: Context, k: String, v: Boolean) = sp(c).edit().putBoolean(k, v).apply()
    fun setString(c: Context, k: String, v: String?) = sp(c).edit().putString(k, v).apply()

    fun formatMinuteOfDay(c: Context, minutes: Int): String {
        val h = minutes / 60
        val m = minutes % 60
        return if (use24h(c)) String.format(java.util.Locale.US, "%02d:%02d", h, m)
        else {
            val period = if (h >= 12) "PM" else "AM"
            val h12 = if (h % 12 == 0) 12 else h % 12
            String.format(java.util.Locale.US, "%d:%02d %s", h12, m, period)
        }
    }
}
