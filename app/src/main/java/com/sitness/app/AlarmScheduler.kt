package com.sitness.app

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import java.util.Calendar

object AlarmScheduler {

    const val ACTION_FIRE = "com.sitness.app.FIRE"
    const val ACTION_NUDGE = "com.sitness.app.NUDGE"
    const val ACTION_SNOOZE_FIRE = "com.sitness.app.SNOOZE_FIRE"

    private const val RC_MAIN = 1001
    private const val RC_NUDGE = 1002
    private const val RC_SNOOZE = 1003

    /** A due time this recent with an alarm still queued is just a late delivery, not a lost alarm. */
    private const val LATE_GRACE_MS = 10 * 60_000L

    private fun am(c: Context) = c.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    private fun intentFor(c: Context, action: String) =
        Intent(c, AlarmReceiver::class.java).setAction(action)

    private fun pi(c: Context, action: String, rc: Int): PendingIntent =
        PendingIntent.getBroadcast(
            c, rc, intentFor(c, action),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

    private fun alarmExists(c: Context, action: String, rc: Int): Boolean =
        PendingIntent.getBroadcast(
            c, rc, intentFor(c, action),
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        ) != null

    fun canScheduleExact(c: Context): Boolean =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) am(c).canScheduleExactAlarms() else true

    private fun setAlarm(c: Context, at: Long, p: PendingIntent) {
        try {
            if (canScheduleExact(c)) am(c).setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, p)
            else am(c).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, p)
        } catch (e: SecurityException) {
            am(c).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, p)
        }
    }

    // ---------- scheduling ----------

    fun rules(c: Context) = ScheduleMath.Rules(
        Prefs.interval(c), Prefs.dayStart(c), Prefs.dayEnd(c), Prefs.activeDays(c)
    )

    /** Every setting that changes when a break is due. If this differs, the stored alarm is stale. */
    private fun signature(c: Context): String {
        val r = rules(c)
        return "${r.intervalMin}|${r.dayStart}|${r.dayEnd}|${r.activeDays.sorted().joinToString(",")}|${Prefs.enabled(c)}"
    }

    private fun remember(c: Context, due: Long) {
        Prefs.setLong(c, Prefs.NEXT_DUE, due)
        Prefs.setString(c, Prefs.TIMING_SIG, signature(c))
    }

    /**
     * Sets the alarm for the next slot on the grid. Because the grid depends only on the settings
     * and the calendar, calling this at any moment gives the same times; it never shifts a break.
     */
    fun reschedule(c: Context) {
        cancelAll(c)
        if (!Prefs.enabled(c)) { remember(c, 0L); return }
        val next = computeNext(c, System.currentTimeMillis())
        if (next <= 0) { remember(c, 0L); return }
        remember(c, next)
        setAlarm(c, next, pi(c, ACTION_FIRE, RC_MAIN))
    }

    /**
     * Cheap version of [reschedule] for opening the app, leaving Settings, a reboot or an update:
     * keeps the alarm that is already queued and only rebuilds when the settings changed, the stored
     * time has passed, or the alarm itself has gone missing.
     */
    fun ensureScheduled(c: Context) {
        if (!Prefs.enabled(c) || Prefs.sp(c).getString(Prefs.TIMING_SIG, null) != signature(c)) {
            reschedule(c)
            return
        }
        val due = Prefs.nextDue(c)
        val now = System.currentTimeMillis()
        val exists = alarmExists(c, ACTION_FIRE, RC_MAIN)
        when {
            due <= 0L -> reschedule(c)
            due <= now && !(exists && now - due < LATE_GRACE_MS) -> reschedule(c)
            !exists -> setAlarm(c, due, pi(c, ACTION_FIRE, RC_MAIN))
        }
    }

    fun scheduleNextAfterFire(c: Context) {
        if (!Prefs.enabled(c)) return
        val next = computeNext(c, System.currentTimeMillis())
        if (next <= 0) return
        remember(c, next)
        setAlarm(c, next, pi(c, ACTION_FIRE, RC_MAIN))
    }

    /** Brings the same break back after [minutes]. Its own alarm, so the grid is left untouched. */
    fun scheduleSnooze(c: Context, minutes: Int) {
        setAlarm(c, System.currentTimeMillis() + minutes * 60_000L, pi(c, ACTION_SNOOZE_FIRE, RC_SNOOZE))
    }

    fun cancelSnooze(c: Context) {
        am(c).cancel(pi(c, ACTION_SNOOZE_FIRE, RC_SNOOZE))
    }

    /** The pending break has been dealt with (done or skipped): forget it, and drop its snooze and nudges. */
    fun resolvePending(c: Context) {
        Prefs.setLong(c, Prefs.PENDING_SINCE, 0L)
        cancelSnooze(c)
        cancelNudge(c)
    }

    fun scheduleNudge(c: Context) {
        if (!Prefs.nudge(c)) return
        if (Prefs.sp(c).getInt(Prefs.NUDGE_COUNT, 0) >= Prefs.nudgeMax(c)) return
        setAlarm(c, System.currentTimeMillis() + Prefs.nudgeAfter(c) * 60_000L, pi(c, ACTION_NUDGE, RC_NUDGE))
    }

    fun cancelNudge(c: Context) {
        am(c).cancel(pi(c, ACTION_NUDGE, RC_NUDGE))
        Prefs.setInt(c, Prefs.NUDGE_COUNT, 0)
    }

    fun cancelAll(c: Context) {
        am(c).cancel(pi(c, ACTION_FIRE, RC_MAIN))
        am(c).cancel(pi(c, ACTION_NUDGE, RC_NUDGE))
        am(c).cancel(pi(c, ACTION_SNOOZE_FIRE, RC_SNOOZE))
    }

    // ---------- timing ----------

    fun computeNext(c: Context, from: Long): Long =
        ScheduleMath.computeNext(rules(c), from, Prefs.pausedUntil(c))

    fun isWithinWindow(c: Context, millis: Long) = ScheduleMath.isWithinWindow(rules(c), millis)

    fun isWithinWindowNow(c: Context) = isWithinWindow(c, System.currentTimeMillis())

    fun pauseFor(c: Context, minutes: Int) {
        Prefs.setLong(c, Prefs.PAUSED_UNTIL, System.currentTimeMillis() + minutes * 60_000L)
        reschedule(c)
    }

    fun pauseRestOfDay(c: Context) {
        val cal = Calendar.getInstance().apply {
            add(Calendar.DAY_OF_YEAR, 1)
            set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 1); set(Calendar.SECOND, 0)
        }
        Prefs.setLong(c, Prefs.PAUSED_UNTIL, cal.timeInMillis)
        reschedule(c)
    }

    fun resume(c: Context) {
        Prefs.setLong(c, Prefs.PAUSED_UNTIL, 0L)
        reschedule(c)
    }

    fun isPaused(c: Context) = Prefs.pausedUntil(c) > System.currentTimeMillis()
}
