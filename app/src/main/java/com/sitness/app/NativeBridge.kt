package com.sitness.app

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.webkit.JavascriptInterface
import androidx.core.content.FileProvider
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.concurrent.CountDownLatch

/**
 * The only door between the web page and the app. The page calls [call] with a method name and a
 * JSON array of arguments and gets back {"ok":true,"data":...} or {"ok":false,"error":"..."}.
 *
 * All real work runs on the main thread, one call at a time, because the stats store and the
 * receivers are not thread-safe. The page only ever loads from the app's own assets.
 */
class NativeBridge(private val activity: MainActivity) {

    private val main = Handler(Looper.getMainLooper())
    private val c: Context get() = activity.applicationContext

    @JavascriptInterface
    fun call(method: String, argsJson: String): String = try {
        val args = JSONArray(argsJson)
        val data = onMain { dispatch(method, args) }
        JSONObject().put("ok", true).put("data", data ?: JSONObject.NULL).toString()
    } catch (e: Exception) {
        JSONObject().put("ok", false).put("error", e.message ?: e.javaClass.simpleName).toString()
    }

    private fun <T> onMain(block: () -> T): T {
        if (Looper.myLooper() == Looper.getMainLooper()) return block()
        val latch = CountDownLatch(1)
        var result: Result<T>? = null
        main.post { result = runCatching(block); latch.countDown() }
        latch.await()
        return result!!.getOrThrow()
    }

    private fun dispatch(method: String, a: JSONArray): Any? = when (method) {
        "getState" -> state()
        "getBreak" -> breakInfo()
        "getReward" -> reward()
        "getStats" -> stats()
        "getSettings" -> SettingsSpec.readAll(c)

        "setSetting" -> {
            val key = a.getString(0)
            if (!SettingsSpec.write(c, key, a.get(1))) throw IllegalArgumentException("Rejected setting: $key")
            afterSetting(key, a.get(1))
            SettingsSpec.readAll(c)
        }
        "resetSettings" -> {
            SettingsSpec.resetAll(c)
            AlarmScheduler.reschedule(c)
            ThemeUtil.applyNightMode(Prefs.theme(c))
            SettingsSpec.readAll(c)
        }
        "resetStats" -> { StatsStore.reset(c); true }

        "startBreak" -> { beginBreak(manual = true); breakInfo() }
        "setExercise" -> { BreakSession.setExercise(c, a.getString(0)); true }
        "togglePause" -> { BreakSession.togglePause(c); breakInfo() }
        "finishBreak" -> { val stage = BreakSession.finish(c); activity.syncWindow(); stage }
        "skipBreak" -> { BreakSession.skip(c); activity.syncWindow(); true }
        "commitBreak" -> {
            BreakSession.commit(c, a.getInt(0))
            activity.syncWindow()
            reward()
        }
        "closeReward" -> { BreakSession.closeReward(c); true }

        "setEnabled" -> {
            Prefs.setBool(c, Prefs.ENABLED, a.getBoolean(0))
            AlarmScheduler.ensureScheduled(c)
            true
        }
        "pauseReminders" -> {
            when (a.getString(0)) {
                "30" -> AlarmScheduler.pauseFor(c, 30)
                "60" -> AlarmScheduler.pauseFor(c, 60)
                "120" -> AlarmScheduler.pauseFor(c, 120)
                "day" -> AlarmScheduler.pauseRestOfDay(c)
                else -> throw IllegalArgumentException("Unknown pause length")
            }
            true
        }
        "resumeReminders" -> { AlarmScheduler.resume(c); true }

        "exportStats" -> { exportStats(); true }
        "openSystem" -> { openSystem(a.getString(0)); true }
        "requestNotificationPermission" -> { activity.requestNotificationPermission(); true }
        "setChrome" -> { activity.setChrome(a.getString(0), a.getBoolean(1)); true }

        else -> throw IllegalArgumentException("Unknown method: $method")
    }

    // ---------- break flow ----------

    private fun beginBreak(manual: Boolean) {
        BreakSession.start(c, manual)
        NotificationHelper.cancel(c)
        AlarmScheduler.cancelNudge(c)
        activity.syncWindow()
    }

    private fun afterSetting(key: String, value: Any?) {
        when (key) {
            Prefs.THEME -> ThemeUtil.applyNightMode(value as String)
            Prefs.ENABLED, Prefs.INTERVAL, Prefs.DAY_START, Prefs.DAY_END, Prefs.ACTIVE_DAYS ->
                AlarmScheduler.ensureScheduled(c)
            Prefs.KEEP_AWAKE -> activity.syncWindow()
        }
    }

    // ---------- views of the app state ----------

    private fun levelJson(xp: Int): JSONObject {
        val (level, into, span) = Gamification.progress(xp)
        return JSONObject()
            .put("level", level).put("title", Gamification.title(level))
            .put("into", into).put("span", span)
            .put("nextTitle", Gamification.title(level + 1))
            .put("toNext", Gamification.xpForLevel(level + 1) - xp)
    }

    private fun state(): JSONObject {
        BreakSession.expireStale(c)
        // A break can now begin while the app is open (AlarmReceiver); keep the screen-awake flag in step.
        activity.syncWindow()
        val xp = StatsStore.xp(c)
        val today = StatsStore.today(c)
        return JSONObject()
            .put("now", System.currentTimeMillis())
            .put("flow", BreakSession.flow(c))
            .put("enabled", Prefs.enabled(c))
            .put("paused", AlarmScheduler.isPaused(c))
            .put("pausedUntil", Prefs.pausedUntil(c))
            .put("inWindow", AlarmScheduler.isWithinWindowNow(c))
            .put("nextDue", Prefs.nextDue(c))
            .put("intervalMs", Prefs.interval(c) * 60_000L)
            .put("windowStart", Prefs.dayStart(c))
            .put("use24h", Prefs.use24h(c))
            .put("xp", xp)
            .put("level", levelJson(xp))
            .put("today", JSONObject()
                .put("completed", today.completed).put("goal", Prefs.dailyGoal(c))
                .put("water", today.water).put("waterGoal", Prefs.waterGoal(c)))
            .put("combo", StatsStore.combo(c))
            .put("streak", StatsStore.streak(c))
            .put("showLine", Prefs.showLine(c))
            .put("pending", Prefs.sp(c).getLong(Prefs.PENDING_SINCE, 0L) > 0L)
            .put("notificationsOff", !NotificationHelper.canNotify(c))
            .put("exactAlarmOff", !AlarmScheduler.canScheduleExact(c))
            .put("accent", Prefs.accent(c))
            .put("isDark", activity.isDark())
    }

    private fun exercisesJson(): JSONArray {
        val pool = Prefs.pool(c)
        val out = JSONArray()
        Exercises.ALL.forEach { ex ->
            out.put(JSONObject()
                .put("id", ex.id).put("name", ex.name).put("category", ex.category)
                .put("instruction", ex.instruction).put("manualOnly", ex.manualOnly)
                .put("inPool", pool.contains(ex.id))
                .put("today", StatsStore.todayCountOf(c, ex.id))
                .put("total", StatsStore.totalCount(c, ex.id)))
        }
        return out
    }

    private fun breakInfo(): JSONObject {
        val stage = BreakSession.stage(c)
        val o = JSONObject().put("stage", stage)
        if (stage.isEmpty()) return o
        return o
            .put("totalMs", BreakSession.totalMs(c))
            .put("elapsedMs", BreakSession.elapsedMs(c))
            .put("running", BreakSession.isRunning(c))
            .put("exerciseId", BreakSession.exerciseId(c))
            .put("exercises", exercisesJson())
            .put("elapsedSeconds", BreakSession.elapsedSeconds(c))
            .put("defaultGlasses", Prefs.defaultGlasses(c))
            .put("waterToday", StatsStore.today(c).water)
            .put("waterGoal", Prefs.waterGoal(c))
    }

    private fun reward(): JSONObject? {
        val r = BreakSession.reward(c) ?: return null
        return r.put("level", levelJson(StatsStore.xp(c)))
    }

    private fun stats(): JSONObject {
        val xp = StatsStore.xp(c)
        val last30 = StatsStore.lastNDays(c, 30)
        val scheduled = last30.sumOf { it.scheduled }
        val completed = last30.sumOf { it.completed }

        val last7 = JSONArray()
        StatsStore.lastNDays(c, 7).forEach {
            last7.put(JSONObject().put("key", it.key).put("completed", it.completed))
        }

        val pool = Prefs.pool(c)
        val eligible = Exercises.ALL.filter { !it.manualOnly && pool.contains(it.id) }
        val least = eligible.minOfOrNull { StatsStore.rotationCount(c, it.id) } ?: 0
        val exercises = JSONArray()
        Exercises.ALL.forEach { ex ->
            exercises.put(JSONObject()
                .put("id", ex.id).put("name", ex.name).put("manualOnly", ex.manualOnly)
                .put("inPool", pool.contains(ex.id))
                .put("total", StatsStore.totalCount(c, ex.id))
                .put("upNext", !ex.manualOnly && pool.contains(ex.id) && StatsStore.rotationCount(c, ex.id) == least))
        }

        val unlocked = StatsStore.badges(c)
        val badges = JSONArray()
        Gamification.CATALOG.forEach { b ->
            badges.put(JSONObject()
                .put("id", b.id).put("name", b.name).put("description", b.description)
                .put("unlockedAt", unlocked[b.id] ?: 0L))
        }

        return JSONObject()
            .put("xp", xp)
            .put("level", levelJson(xp))
            .put("totalBreaks", StatsStore.totalBreaks(c))
            .put("minutes", StatsStore.totalSeconds(c) / 60)
            .put("streak", StatsStore.streak(c))
            .put("bestStreak", StatsStore.longestStreak(c))
            .put("bestCombo", StatsStore.bestCombo(c))
            .put("glasses", StatsStore.totalWater(c))
            .put("activeDays", StatsStore.activeDaysCount(c))
            .put("badgeCount", unlocked.size)
            .put("rate30", if (scheduled == 0) JSONObject.NULL else completed * 100 / scheduled)
            .put("last7", last7)
            .put("exercises", exercises)
            .put("badges", badges)
    }

    // ---------- things that leave the app ----------

    private fun exportStats() {
        val dir = File(c.filesDir, "exports")
        dir.mkdirs()
        // Earlier exports hold the same history; do not let them pile up in app storage.
        dir.listFiles()?.forEach { it.delete() }
        val stamp = SimpleDateFormat("yyyyMMdd-HHmm", Locale.US).format(Date())
        val file = File(dir, "sitness-stats-$stamp.json")
        file.writeText(StatsStore.rawJson(c))
        val uri = FileProvider.getUriForFile(c, "${c.packageName}.fileprovider", file)
        activity.startActivity(
            Intent.createChooser(
                Intent(Intent.ACTION_SEND)
                    .setType("application/json")
                    .putExtra(Intent.EXTRA_STREAM, uri)
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION),
                "Export statistics"
            )
        )
    }

    private fun appInfo() {
        runCatching {
            activity.startActivity(
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                    .setData(Uri.parse("package:${c.packageName}"))
            )
        }
    }

    private fun openSystem(which: String) {
        when (which) {
            "exact_alarm" ->
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    runCatching { activity.startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)) }
                        .onFailure { appInfo() }
                } else appInfo()
            "battery" ->
                runCatching {
                    activity.startActivity(
                        Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                            .setData(Uri.parse("package:${c.packageName}"))
                    )
                }.onFailure { appInfo() }
            "notifications" ->
                runCatching {
                    activity.startActivity(
                        Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                            .putExtra(Settings.EXTRA_APP_PACKAGE, c.packageName)
                    )
                }.onFailure { appInfo() }
            else -> throw IllegalArgumentException("Unknown settings page")
        }
    }
}
