package com.sitness.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            AlarmScheduler.ACTION_FIRE -> fire(context)
            AlarmScheduler.ACTION_SNOOZE_FIRE -> snoozeFire(context)
            AlarmScheduler.ACTION_NUDGE -> nudge(context)
        }
    }

    /** A slot on the fixed grid has arrived. */
    private fun fire(c: Context) {
        if (!Prefs.enabled(c)) return

        if (Prefs.sp(c).getLong(Prefs.PENDING_SINCE, 0L) > 0L) {
            // The previous break was never answered (a snooze still waiting counts too). Charge it
            // to the day it belonged to, and let this new slot replace it.
            StatsStore.recordMissed(c, Prefs.sp(c).getString(Prefs.PENDING_DAY, null))
        }
        AlarmScheduler.cancelSnooze(c)

        Prefs.setLong(c, Prefs.PENDING_SINCE, System.currentTimeMillis())
        Prefs.setString(c, Prefs.PENDING_DAY, StatsStore.todayKey())
        Prefs.setInt(c, Prefs.NUDGE_COUNT, 0)
        Prefs.setInt(c, Prefs.SNOOZE_COUNT, 0)
        StatsStore.recordScheduled(c)

        alert(c)
        AlarmScheduler.scheduleNextAfterFire(c)
    }

    /** The same break coming back after a snooze: not a new break, and not a miss. The grid is untouched. */
    private fun snoozeFire(c: Context) {
        if (Prefs.sp(c).getLong(Prefs.PENDING_SINCE, 0L) == 0L) return   // done or skipped meanwhile
        Prefs.setInt(c, Prefs.NUDGE_COUNT, 0)
        alert(c)
    }

    /**
     * Tells the user a break is due. If they have the app open in front of them, the break simply
     * starts (the page notices on its next refresh). Otherwise they get a notification to tap.
     * A reward or water step still on screen is never replaced: that falls back to the notification.
     */
    private fun alert(c: Context) {
        if (MainActivity.isInForeground && BreakSession.stage(c).isEmpty()) {
            NotificationHelper.cancel(c)
            BreakSession.start(c, manual = false)
        } else {
            NotificationHelper.showBreakDue(c, false)
            AlarmScheduler.scheduleNudge(c)
        }
    }

    private fun nudge(c: Context) {
        if (Prefs.sp(c).getLong(Prefs.PENDING_SINCE, 0L) == 0L) return
        Prefs.setInt(c, Prefs.NUDGE_COUNT, Prefs.sp(c).getInt(Prefs.NUDGE_COUNT, 0) + 1)
        NotificationHelper.showBreakDue(c, true)
        AlarmScheduler.scheduleNudge(c)
    }
}
