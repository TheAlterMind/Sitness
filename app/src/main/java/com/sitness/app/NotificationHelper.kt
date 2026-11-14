package com.sitness.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object NotificationHelper {

    const val NOTIF_ID = 42
    private const val PREFIX = "breaks_"

    private fun nm(c: Context) = c.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    private fun channelId(c: Context): String {
        val s = if (Prefs.sound(c)) Prefs.soundKind(c) else "silent"
        val v = if (Prefs.vibrate(c)) Prefs.vibeKind(c) else "none"
        return PREFIX + s + "_" + v
    }

    private fun pattern(kind: String): LongArray? = when (kind) {
        "short" -> longArrayOf(0, 250, 200, 250)
        "long" -> longArrayOf(0, 700, 300, 700)
        "pulse" -> longArrayOf(0, 120, 100, 120, 100, 120, 100, 400)
        else -> null
    }

    /** False when the user has blocked the app's notifications, or the reminder channel itself. */
    fun canNotify(c: Context): Boolean {
        if (!NotificationManagerCompat.from(c).areNotificationsEnabled()) return false
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val ch = nm(c).getNotificationChannel(channelId(c))
            if (ch != null && ch.importance == NotificationManager.IMPORTANCE_NONE) return false
        }
        return true
    }

    /** Android 14 can withhold the full-screen-intent permission; without it the notification is heads-up only. */
    private fun canFullScreen(c: Context): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE || nm(c).canUseFullScreenIntent()

    fun ensureChannel(c: Context): String {
        val id = channelId(c)
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return id
        val manager = nm(c)
        manager.notificationChannels
            .filter { it.id.startsWith(PREFIX) && it.id != id }
            .forEach { manager.deleteNotificationChannel(it.id) }
        if (manager.getNotificationChannel(id) != null) return id

        val ch = NotificationChannel(id, "Break reminders", NotificationManager.IMPORTANCE_HIGH)
        ch.description = "Fires when it is time to stand up and move."
        ch.enableLights(true)

        if (Prefs.sound(c)) {
            val type = when (Prefs.soundKind(c)) {
                "alarm" -> RingtoneManager.TYPE_ALARM
                "ringtone" -> RingtoneManager.TYPE_RINGTONE
                else -> RingtoneManager.TYPE_NOTIFICATION
            }
            val usage = if (type == RingtoneManager.TYPE_ALARM)
                AudioAttributes.USAGE_ALARM else AudioAttributes.USAGE_NOTIFICATION
            ch.setSound(
                RingtoneManager.getDefaultUri(type),
                AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(usage).build()
            )
        } else ch.setSound(null, null)

        val p = if (Prefs.vibrate(c)) pattern(Prefs.vibeKind(c)) else null
        if (p != null) { ch.enableVibration(true); ch.vibrationPattern = p } else ch.enableVibration(false)

        manager.createNotificationChannel(ch)
        return id
    }

    private fun action(c: Context, a: String, rc: Int): PendingIntent =
        PendingIntent.getBroadcast(
            c, rc, Intent(c, ActionReceiver::class.java).setAction(a),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

    fun showBreakDue(c: Context, isNudge: Boolean) {
        val id = ensureChannel(c)

        val open = PendingIntent.getActivity(
            c, 2001,
            Intent(c, MainActivity::class.java)
                .setAction(MainActivity.ACTION_START_BREAK)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val text = "Stand up for ${Prefs.breakMinutes(c)} min. One exercise, then some water."
        val b = NotificationCompat.Builder(c, id)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(if (isNudge) "Still sitting?" else "Time to move")
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(open)
            .addAction(0, "Start", open)
            .addAction(0, "Snooze", action(c, ActionReceiver.ACTION_SNOOZE, 2002))
            .addAction(0, "Skip", action(c, ActionReceiver.ACTION_SKIP, 2003))

        if (Prefs.fullscreen(c) && canFullScreen(c)) b.setFullScreenIntent(open, true)

        try {
            NotificationManagerCompat.from(c).notify(NOTIF_ID, b.build())
        } catch (e: SecurityException) {
            // Permission revoked between the check and the call. The home screen shows a banner
            // (see canNotify) so the user finds out; nothing else can interrupt them from here.
        }
    }

    fun cancel(c: Context) = NotificationManagerCompat.from(c).cancel(NOTIF_ID)
}
