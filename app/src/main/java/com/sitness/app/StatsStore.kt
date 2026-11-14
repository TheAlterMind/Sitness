package com.sitness.app

import android.content.Context
import org.json.JSONObject
import java.util.Calendar

data class DayStat(
    val key: String,
    val scheduled: Int = 0,
    val completed: Int = 0,
    val skipped: Int = 0,
    val missed: Int = 0,
    val snoozed: Int = 0,
    val seconds: Int = 0,
    val water: Int = 0,
    val xp: Int = 0,
    val goalMet: Boolean = false
)

/**
 * All history in one JSON blob in SharedPreferences. No database, no network.
 */
object StatsStore {

    private const val FILE = "sitness_stats"
    private const val KEY = "stats_json"
    private const val KEY_CORRUPT = "stats_json_corrupt"
    private var cache: JSONObject? = null

    private fun sp(c: Context) = c.applicationContext.getSharedPreferences(FILE, Context.MODE_PRIVATE)

    private fun root(c: Context): JSONObject {
        cache?.let { return it }
        val raw = sp(c).getString(KEY, null)
        val o = try {
            if (raw.isNullOrBlank()) JSONObject() else JSONObject(raw)
        } catch (e: Exception) {
            // Unreadable history. Keep the bytes aside rather than silently overwriting them.
            if (!raw.isNullOrBlank()) sp(c).edit().putString(KEY_CORRUPT, raw).apply()
            JSONObject()
        }
        listOf("days", "exTotal", "exDaily", "hours", "profile", "badges").forEach {
            if (!o.has(it)) o.put(it, JSONObject())
        }
        cache = o
        return o
    }

    private fun persist(c: Context) {
        cache?.let { sp(c).edit().putString(KEY, it.toString()).apply() }
    }

    fun rawJson(c: Context): String = root(c).toString(2)
    fun todayKey(): String = DayMath.keyOf(System.currentTimeMillis())

    private fun days(c: Context) = root(c).getJSONObject("days")
    private fun profile(c: Context) = root(c).getJSONObject("profile")

    private fun dayObj(c: Context, key: String): JSONObject {
        val d = days(c)
        if (!d.has(key)) d.put(key, JSONObject())
        return d.getJSONObject(key)
    }

    private fun bump(o: JSONObject, f: String, by: Int) = o.put(f, o.optInt(f, 0) + by)

    fun getDay(c: Context, key: String): DayStat {
        val o = days(c).optJSONObject(key) ?: return DayStat(key)
        return DayStat(
            key, o.optInt("scheduled"), o.optInt("completed"), o.optInt("skipped"),
            o.optInt("missed"), o.optInt("snoozed"), o.optInt("seconds"), o.optInt("water"),
            o.optInt("xp"), o.optBoolean("goalMet")
        )
    }

    fun today(c: Context) = getDay(c, todayKey())

    // --- profile ---
    fun xp(c: Context) = profile(c).optInt("xp", 0)
    fun totalBreaks(c: Context) = profile(c).optInt("totalBreaks", 0)
    fun totalSeconds(c: Context) = profile(c).optInt("totalSeconds", 0)
    fun totalWater(c: Context) = profile(c).optInt("totalWater", 0)
    fun streak(c: Context) = profile(c).optInt("streak", 0)
    fun longestStreak(c: Context) = profile(c).optInt("longestStreak", 0)
    fun combo(c: Context) = profile(c).optInt("combo", 0)
    fun bestCombo(c: Context) = profile(c).optInt("bestCombo", 0)

    // --- exercise counters ---
    fun totalCount(c: Context, id: String) = root(c).getJSONObject("exTotal").optInt(id, 0)

    private fun dailyObj(c: Context): JSONObject {
        val d = root(c).getJSONObject("exDaily")
        val k = todayKey()
        if (!d.has(k)) {
            // Only today's bucket is kept; yesterday's is dropped on first use of a new day.
            val fresh = JSONObject()
            val it = d.keys()
            val stale = ArrayList<String>()
            while (it.hasNext()) stale.add(it.next())
            stale.forEach { key -> d.remove(key) }
            d.put(k, fresh)
        }
        return d.getJSONObject(k)
    }

    fun todayCountOf(c: Context, id: String) = dailyObj(c).optInt(id, 0)

    /** What the rotation should measure: today's counts, or all-time if daily reset is off. */
    fun rotationCount(c: Context, id: String): Int =
        if (Prefs.resetDaily(c)) todayCountOf(c, id) else totalCount(c, id)

    fun todayCount(c: Context, id: String) = rotationCount(c, id)

    // --- badges ---
    fun badges(c: Context): Map<String, Long> {
        val o = root(c).getJSONObject("badges")
        val out = HashMap<String, Long>()
        val it = o.keys()
        while (it.hasNext()) { val k = it.next(); out[k] = o.optLong(k, 0L) }
        return out
    }

    fun unlock(c: Context, id: String): Boolean {
        val o = root(c).getJSONObject("badges")
        if (o.has(id)) return false
        o.put(id, System.currentTimeMillis())
        persist(c)
        return true
    }

    // --- recording ---
    fun recordScheduled(c: Context) { bump(dayObj(c, todayKey()), "scheduled", 1); persist(c) }
    fun recordSnoozed(c: Context) { bump(dayObj(c, todayKey()), "snoozed", 1); persist(c) }

    fun recordSkipped(c: Context) {
        bump(dayObj(c, todayKey()), "skipped", 1)
        profile(c).put("combo", 0)
        persist(c)
    }

    /** [dayKey] is the day the unanswered break was scheduled on; today if unknown. */
    fun recordMissed(c: Context, dayKey: String? = null) {
        bump(dayObj(c, dayKey ?: todayKey()), "missed", 1)
        profile(c).put("combo", 0)
        persist(c)
    }

    /** Registers a finished break. Scoring itself lives in Scoring.kt. */
    fun recordCompleted(c: Context, seconds: Int, exerciseId: String, glasses: Int, earnedXp: Int) {
        val d = dayObj(c, todayKey())
        val p = profile(c)

        bump(d, "completed", 1)
        bump(d, "seconds", seconds)
        bump(d, "water", glasses)
        bump(d, "xp", earnedXp)

        p.put("totalBreaks", p.optInt("totalBreaks", 0) + 1)
        p.put("totalSeconds", p.optInt("totalSeconds", 0) + seconds)
        p.put("totalWater", p.optInt("totalWater", 0) + glasses)
        p.put("xp", p.optInt("xp", 0) + earnedXp)
        p.put("lastActiveDate", todayKey())

        val newCombo = p.optInt("combo", 0) + 1
        p.put("combo", newCombo)
        if (newCombo > p.optInt("bestCombo", 0)) p.put("bestCombo", newCombo)

        val exTotal = root(c).getJSONObject("exTotal")
        exTotal.put(exerciseId, exTotal.optInt(exerciseId, 0) + 1)
        val daily = dailyObj(c)
        daily.put(exerciseId, daily.optInt(exerciseId, 0) + 1)

        val hours = root(c).getJSONObject("hours")
        val hk = Calendar.getInstance().get(Calendar.HOUR_OF_DAY).toString()
        hours.put(hk, hours.optInt(hk, 0) + 1)

        persist(c)
    }

    fun addXp(c: Context, amount: Int) {
        if (amount == 0) return
        bump(dayObj(c, todayKey()), "xp", amount)
        val p = profile(c)
        p.put("xp", p.optInt("xp", 0) + amount)
        persist(c)
    }

    fun markGoalMet(c: Context) {
        val key = todayKey()
        val d = dayObj(c, key)
        if (d.optBoolean("goalMet", false)) return
        d.put("goalMet", true)

        val p = profile(c)
        val last = p.optString("lastGoalDate", "")
        // Only days the schedule actually runs can be missed, so a weekend off is not a gap.
        val newStreak = if (last.isBlank()) 1 else {
            val missed = DayMath.activeDaysBetween(last, key, Prefs.activeDays(c))
            if (missed <= Prefs.grace(c)) p.optInt("streak", 0) + 1 else 1
        }
        p.put("streak", newStreak)
        p.put("lastGoalDate", key)
        if (newStreak > p.optInt("longestStreak", 0)) p.put("longestStreak", newStreak)
        persist(c)
    }

    /** Streaks lapse if the app is opened after too long a gap. */
    fun refreshStreak(c: Context) {
        val p = profile(c)
        val last = p.optString("lastGoalDate", "")
        if (last.isBlank()) return
        // Today is still in play, so only the days before it count as missed.
        if (DayMath.activeDaysBetween(last, todayKey(), Prefs.activeDays(c)) > Prefs.grace(c)) {
            p.put("streak", 0)
            persist(c)
        }
    }

    fun daysBetween(a: String, b: String): Int = DayMath.daysBetween(a, b)

    fun lastNDays(c: Context, n: Int): List<DayStat> {
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, -(n - 1))
        val out = ArrayList<DayStat>()
        repeat(n) {
            out.add(getDay(c, DayMath.keyOf(cal.timeInMillis)))
            cal.add(Calendar.DAY_OF_YEAR, 1)
        }
        return out
    }

    fun activeDaysCount(c: Context): Int {
        var n = 0
        val d = days(c)
        val it = d.keys()
        while (it.hasNext()) if (d.getJSONObject(it.next()).optInt("completed", 0) > 0) n++
        return n
    }

    fun reset(c: Context) {
        cache = null
        sp(c).edit().remove(KEY).apply()
    }
}
