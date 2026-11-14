package com.sitness.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            // The clock moved, so the stored absolute due time cannot be trusted.
            Intent.ACTION_TIME_CHANGED, Intent.ACTION_TIMEZONE_CHANGED ->
                AlarmScheduler.reschedule(context)
            // Alarms were wiped; put the existing schedule back rather than restarting it.
            Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_MY_PACKAGE_REPLACED ->
                AlarmScheduler.ensureScheduled(context)
        }
    }
}
