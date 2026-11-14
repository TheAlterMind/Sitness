package com.sitness.app

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

/**
 * Pure scheduling arithmetic. No Context and no Android classes, so it runs in plain JVM unit tests.
 *
 * Breaks sit on a fixed grid: the window opens at "start of day" and a break is due every
 * [Rules.intervalMin] minutes from then (start 09:00 and 60 min gives 09:00, 10:00, 11:00 ...).
 * The grid depends only on the settings and the calendar, never on when the last break
 * happened, was snoozed, or whether reminders were paused, so the times never drift.
 */
object ScheduleMath {

    class Rules(
        val intervalMin: Int,
        /** Minute of day the window opens, and where the grid starts. */
        val dayStart: Int,
        /** Minute of day the window closes (inclusive). Equal to [dayStart] means all day. */
        val dayEnd: Int,
        /** Calendar.DAY_OF_WEEK values on which the window opens. Empty means every day. */
        val activeDays: Set<Int>
    )

    private fun minuteOfDay(cal: Calendar) = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)

    private fun dayActive(r: Rules, cal: Calendar) =
        r.activeDays.isEmpty() || r.activeDays.contains(cal.get(Calendar.DAY_OF_WEEK))

    /** Whether [millis] falls inside an open window. An overnight window belongs to the day it opened on. */
    fun isWithinWindow(r: Rules, millis: Long): Boolean {
        val cal = Calendar.getInstance().apply { timeInMillis = millis }
        val m = minuteOfDay(cal)
        if (r.dayStart == r.dayEnd) return dayActive(r, cal)
        if (r.dayStart < r.dayEnd) return dayActive(r, cal) && m in r.dayStart..r.dayEnd
        if (m >= r.dayStart) return dayActive(r, cal)            // the evening part of today's window
        if (m <= r.dayEnd) {                                     // the small hours of yesterday's window
            cal.add(Calendar.DAY_OF_YEAR, -1)
            return dayActive(r, cal)
        }
        return false
    }

    /**
     * The next break due after [from]. If reminders are paused until [pausedUntil], slots before
     * then are skipped and the first slot at or after it is used; the grid itself never moves.
     */
    fun computeNext(r: Rules, from: Long, pausedUntil: Long): Long {
        val after = if (pausedUntil > from) pausedUntil - 1 else from
        return nextSlotAfter(r, after) ?: (after + r.intervalMin * 60_000L)
    }

    /** The first grid slot strictly after [t], or null if no day is active. */
    private fun nextSlotAfter(r: Rules, t: Long): Long? {
        val intervalMs = r.intervalMin * 60_000L
        val anchor = if (r.dayStart == r.dayEnd) 0 else r.dayStart

        // Start from yesterday: an overnight window opened then may still be running.
        val day = Calendar.getInstance().apply {
            timeInMillis = t
            set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
            add(Calendar.DAY_OF_YEAR, -1)
        }
        repeat(10) {
            if (dayActive(r, day)) {
                val open = (day.clone() as Calendar).apply {
                    set(Calendar.HOUR_OF_DAY, anchor / 60); set(Calendar.MINUTE, anchor % 60)
                }
                var slot = open.timeInMillis
                if (t >= slot) slot += ((t - slot) / intervalMs + 1) * intervalMs
                if (slot < closeOf(r, open)) return slot
            }
            day.add(Calendar.DAY_OF_YEAR, 1)
        }
        return null
    }

    /** The instant (exclusive) at which the window that opened at [open] ends. */
    private fun closeOf(r: Rules, open: Calendar): Long {
        val c = open.clone() as Calendar
        if (r.dayStart == r.dayEnd) {
            c.add(Calendar.DAY_OF_YEAR, 1)                       // all day: until midnight
            return c.timeInMillis
        }
        if (r.dayStart > r.dayEnd) c.add(Calendar.DAY_OF_YEAR, 1)
        c.set(Calendar.HOUR_OF_DAY, r.dayEnd / 60); c.set(Calendar.MINUTE, r.dayEnd % 60)
        c.set(Calendar.SECOND, 0); c.set(Calendar.MILLISECOND, 0)
        return c.timeInMillis + 60_000L                           // the closing minute itself is still open
    }
}

/** Calendar-day helpers on "yyyy-MM-dd" keys. A formatter is built per call so a timezone change is honoured. */
object DayMath {

    private fun fmt() = SimpleDateFormat("yyyy-MM-dd", Locale.US)

    fun keyOf(millis: Long): String = fmt().format(Date(millis))

    private fun parse(key: String): Calendar? = try {
        fmt().parse(key)?.let { d -> Calendar.getInstance().apply { time = d } }
    } catch (e: Exception) { null }

    /** Whole calendar days from [a] to [b]; 999 if either key is unreadable. */
    fun daysBetween(a: String, b: String): Int {
        val ca = parse(a) ?: return 999
        val cb = parse(b) ?: return 999
        return Math.round((cb.timeInMillis - ca.timeInMillis) / 86_400_000.0).toInt()
    }

    /**
     * Days strictly between [a] and [b] that fall on an active weekday. This is what a streak
     * cares about: a weekend the schedule does not run is not a missed day.
     * [days] holds Calendar.DAY_OF_WEEK values; empty means every day. 999 if a key is unreadable.
     */
    fun activeDaysBetween(a: String, b: String, days: Set<Int>): Int {
        val ca = parse(a) ?: return 999
        val cb = parse(b) ?: return 999
        var n = 0
        val cur = ca.clone() as Calendar
        cur.add(Calendar.DAY_OF_YEAR, 1)
        var guard = 0
        while (cur.before(cb) && guard < 400) {
            if (days.isEmpty() || days.contains(cur.get(Calendar.DAY_OF_WEEK))) n++
            cur.add(Calendar.DAY_OF_YEAR, 1)
            guard++
        }
        return n
    }
}
