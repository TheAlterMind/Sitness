package com.sitness.app

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * The settings the web UI may read and change, with the limits the native side enforces.
 * The page is never trusted to stay inside them.
 */
object SettingsSpec {

    private sealed class Kind
    private object Bool : Kind()
    private class Num(val min: Int, val max: Int) : Kind()
    private class Choice(val allowed: Set<String>) : Kind()
    private class Multi(val allowed: Set<String>) : Kind()

    private val KINDS: Map<String, Kind> = mapOf(
        Prefs.ENABLED to Bool,
        Prefs.INTERVAL to Num(Prefs.INTERVAL_RANGE.first, Prefs.INTERVAL_RANGE.last),
        Prefs.BREAK_MINUTES to Num(Prefs.BREAK_RANGE.first, Prefs.BREAK_RANGE.last),
        Prefs.DAY_START to Num(0, 1439),
        Prefs.DAY_END to Num(0, 1439),
        Prefs.ACTIVE_DAYS to Multi(setOf("1", "2", "3", "4", "5", "6", "7")),

        Prefs.SOUND to Bool,
        Prefs.SOUND_KIND to Choice(setOf("notification", "alarm", "ringtone")),
        Prefs.VIBRATE to Bool,
        Prefs.VIBE_KIND to Choice(setOf("short", "long", "pulse")),
        Prefs.FULLSCREEN to Bool,
        Prefs.NUDGE to Bool,
        Prefs.NUDGE_AFTER to Num(1, 30),
        Prefs.NUDGE_MAX to Num(0, 5),
        Prefs.SNOOZE to Num(Prefs.SNOOZE_RANGE.first, Prefs.SNOOZE_RANGE.last),
        Prefs.SNOOZE_MAX to Num(0, 10),

        Prefs.AUTO_START to Bool,
        Prefs.KEEP_AWAKE to Bool,
        Prefs.POOL to Multi(Exercises.IDS.toSet()),
        Prefs.ROTATION to Choice(setOf("least", "random")),
        Prefs.RESET_DAILY to Bool,

        Prefs.TRACK_WATER to Bool,
        Prefs.DEFAULT_GLASSES to Num(0, 4),
        Prefs.WATER_GOAL to Num(0, 20),

        Prefs.DAILY_GOAL to Num(1, 24),
        Prefs.GRACE to Num(0, 3),
        Prefs.DIFFICULTY to Choice(setOf("casual", "standard", "hardcore")),
        Prefs.FULL_BONUS to Bool,

        Prefs.THEME to Choice(setOf("system", "light", "dark")),
        Prefs.ACCENT to Choice(setOf("violet", "teal", "amber", "coral")),
        Prefs.TIME_FORMAT to Choice(setOf("24", "12")),
        Prefs.SHOW_LINE to Bool
    )

    fun readAll(c: Context): JSONObject = JSONObject().apply {
        put(Prefs.ENABLED, Prefs.enabled(c))
        put(Prefs.INTERVAL, Prefs.interval(c))
        put(Prefs.BREAK_MINUTES, Prefs.breakMinutes(c))
        put(Prefs.DAY_START, Prefs.dayStart(c))
        put(Prefs.DAY_END, Prefs.dayEnd(c))
        put(Prefs.ACTIVE_DAYS, JSONArray(Prefs.activeDays(c).sorted().map { it.toString() }))

        put(Prefs.SOUND, Prefs.sound(c))
        put(Prefs.SOUND_KIND, Prefs.soundKind(c))
        put(Prefs.VIBRATE, Prefs.vibrate(c))
        put(Prefs.VIBE_KIND, Prefs.vibeKind(c))
        put(Prefs.FULLSCREEN, Prefs.fullscreen(c))
        put(Prefs.NUDGE, Prefs.nudge(c))
        put(Prefs.NUDGE_AFTER, Prefs.nudgeAfter(c))
        put(Prefs.NUDGE_MAX, Prefs.nudgeMax(c))
        put(Prefs.SNOOZE, Prefs.snooze(c))
        put(Prefs.SNOOZE_MAX, Prefs.snoozeMax(c))

        put(Prefs.AUTO_START, Prefs.autoStart(c))
        put(Prefs.KEEP_AWAKE, Prefs.keepAwake(c))
        val pool = Prefs.pool(c)
        put(Prefs.POOL, JSONArray(Exercises.IDS.filter { pool.contains(it) }))
        put(Prefs.ROTATION, Prefs.rotation(c))
        put(Prefs.RESET_DAILY, Prefs.resetDaily(c))

        put(Prefs.TRACK_WATER, Prefs.trackWater(c))
        put(Prefs.DEFAULT_GLASSES, Prefs.defaultGlasses(c))
        put(Prefs.WATER_GOAL, Prefs.waterGoal(c))

        put(Prefs.DAILY_GOAL, Prefs.dailyGoal(c))
        put(Prefs.GRACE, Prefs.grace(c))
        put(Prefs.DIFFICULTY, Prefs.difficulty(c))
        put(Prefs.FULL_BONUS, Prefs.fullBonus(c))

        put(Prefs.THEME, Prefs.theme(c))
        put(Prefs.ACCENT, Prefs.accent(c))
        put(Prefs.TIME_FORMAT, if (Prefs.use24h(c)) "24" else "12")
        put(Prefs.SHOW_LINE, Prefs.showLine(c))
    }

    /** Validates and stores one setting. False if the key is unknown or the value is not acceptable. */
    fun write(c: Context, key: String, value: Any?): Boolean {
        val kind = KINDS[key] ?: return false
        val ed = Prefs.sp(c).edit()
        when (kind) {
            is Bool -> ed.putBoolean(key, value as? Boolean ?: return false)
            is Num -> ed.putInt(key, ((value as? Number)?.toInt() ?: return false).coerceIn(kind.min, kind.max))
            is Choice -> {
                val s = value as? String ?: return false
                if (s !in kind.allowed) return false
                ed.putString(key, s)
            }
            is Multi -> {
                val arr = value as? JSONArray ?: return false
                val set = (0 until arr.length()).map { arr.optString(it) }.filter { it in kind.allowed }.toSet()
                if (set.isEmpty()) return false      // at least one day / one exercise
                ed.putStringSet(key, set)
            }
        }
        ed.apply()
        return true
    }

    /** Back to the defaults. Runtime state (next due time, pending break) is left alone. */
    fun resetAll(c: Context) {
        val ed = Prefs.sp(c).edit()
        KINDS.keys.forEach { ed.remove(it) }
        ed.apply()
    }
}
