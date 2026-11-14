package com.sitness.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class ActionReceiver : BroadcastReceiver() {

    companion object {
        const val ACTION_SNOOZE = "com.sitness.app.SNOOZE"
        const val ACTION_SKIP = "com.sitness.app.SKIP"
    }

    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            ACTION_SNOOZE -> {
                val used = Prefs.sp(context).getInt(Prefs.SNOOZE_COUNT, 0)
                if (used < Prefs.snoozeMax(context)) {
                    Prefs.setInt(context, Prefs.SNOOZE_COUNT, used + 1)
                    StatsStore.recordSnoozed(context)
                    AlarmScheduler.cancelNudge(context)
                    AlarmScheduler.scheduleSnooze(context, Prefs.snooze(context))
                } else {
                    // Out of snoozes: the break counts as skipped.
                    StatsStore.recordSkipped(context)
                    AlarmScheduler.resolvePending(context)
                }
                NotificationHelper.cancel(context)
            }
            ACTION_SKIP -> {
                StatsStore.recordSkipped(context)
                AlarmScheduler.resolvePending(context)
                NotificationHelper.cancel(context)
            }
        }
    }
}
