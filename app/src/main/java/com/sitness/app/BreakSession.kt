package com.sitness.app

import android.content.Context
import android.os.SystemClock
import org.json.JSONArray
import org.json.JSONObject

/**
 * The break in progress, kept natively so the web page can be destroyed, reloaded or rotated
 * without losing it. Stages run break -> water -> reward and are persisted, so even process
 * death resumes where the user was.
 */
object BreakSession {

    const val STAGE_BREAK = "break"
    const val STAGE_WATER = "water"
    const val STAGE_REWARD = "reward"

    private const val K_STAGE = "bs_stage"
    private const val K_EXERCISE = "bs_exercise"
    private const val K_TOTAL = "bs_total_ms"
    private const val K_BANKED = "bs_banked_ms"
    private const val K_RUN_RT = "bs_run_rt"        // SystemClock.elapsedRealtime() at last start; 0 = paused
    private const val K_STARTED = "bs_started_wall"
    private const val K_SECONDS = "bs_seconds"
    private const val K_FULL = "bs_full"
    private const val K_REWARD = "bs_reward_json"

    /** A break abandoned for this long is dropped rather than resumed. */
    private const val STALE_MS = 60 * 60_000L

    private fun sp(c: Context) = Prefs.sp(c)

    fun stage(c: Context): String = sp(c).getString(K_STAGE, "") ?: ""
    fun flow(c: Context): String = stage(c).ifEmpty { "idle" }
    fun exerciseId(c: Context): String = sp(c).getString(K_EXERCISE, Exercises.ALL[0].id) ?: Exercises.ALL[0].id
    fun totalMs(c: Context): Long = sp(c).getLong(K_TOTAL, 0L)
    fun isRunning(c: Context): Boolean = sp(c).getLong(K_RUN_RT, 0L) != 0L
    fun elapsedSeconds(c: Context): Int = sp(c).getInt(K_SECONDS, 0)

    fun elapsedMs(c: Context): Long {
        val p = sp(c)
        val run = p.getLong(K_RUN_RT, 0L)
        val live = if (run != 0L) (SystemClock.elapsedRealtime() - run).coerceAtLeast(0L) else 0L
        return (p.getLong(K_BANKED, 0L) + live).coerceIn(0L, totalMs(c))
    }

    /**
     * Opens a break. Idempotent: if a fresh break is already under way (the page reloaded, or the
     * notification was tapped twice) it carries on instead of starting over.
     */
    fun start(c: Context, manual: Boolean) {
        val now = System.currentTimeMillis()
        val p = sp(c)
        val current = stage(c)
        val fresh = now - p.getLong(K_STARTED, 0L) < STALE_MS
        if ((current == STAGE_BREAK || current == STAGE_WATER) && fresh) return

        // A break the user starts by hand is a new one, unless a reminder is already waiting for it.
        if (manual && p.getLong(Prefs.PENDING_SINCE, 0L) == 0L) StatsStore.recordScheduled(c)

        p.edit()
            .putString(K_STAGE, STAGE_BREAK)
            .putString(K_EXERCISE, Exercises.ALL[Exercises.suggest(c)].id)
            .putLong(K_TOTAL, Prefs.breakMinutes(c) * 60_000L)
            .putLong(K_BANKED, 0L)
            .putLong(K_RUN_RT, if (Prefs.autoStart(c)) SystemClock.elapsedRealtime() else 0L)
            .putLong(K_STARTED, now)
            .remove(K_REWARD)
            .apply()
    }

    /** Drops a break or water step that has been sitting for over an hour, so an old one is never scored today. */
    fun expireStale(c: Context) {
        val s = stage(c)
        if ((s == STAGE_BREAK || s == STAGE_WATER) &&
            System.currentTimeMillis() - sp(c).getLong(K_STARTED, 0L) >= STALE_MS
        ) clear(c)
    }

    fun setExercise(c: Context, id: String) {
        if (stage(c) == STAGE_BREAK && Exercises.byId(id) != null) sp(c).edit().putString(K_EXERCISE, id).apply()
    }

    fun togglePause(c: Context) {
        if (stage(c) != STAGE_BREAK) return
        val p = sp(c)
        if (isRunning(c)) {
            p.edit().putLong(K_BANKED, elapsedMs(c)).putLong(K_RUN_RT, 0L).apply()
        } else {
            p.edit().putLong(K_RUN_RT, SystemClock.elapsedRealtime()).apply()
        }
    }

    /** Done, or the timer ran out. Returns the stage the page should show next. */
    fun finish(c: Context): String {
        if (stage(c) != STAGE_BREAK) return stage(c)
        val ms = elapsedMs(c)
        val seconds = (ms / 1000L).toInt()
        val full = ms >= totalMs(c)
        AlarmScheduler.resolvePending(c)

        sp(c).edit()
            .putInt(K_SECONDS, seconds).putBoolean(K_FULL, full)
            .putLong(K_BANKED, ms).putLong(K_RUN_RT, 0L)
            .apply()

        return if (Prefs.trackWater(c)) {
            sp(c).edit().putString(K_STAGE, STAGE_WATER).apply()
            STAGE_WATER
        } else {
            commit(c, 0, allowFromBreak = true)
            STAGE_REWARD
        }
    }

    fun skip(c: Context) {
        if (stage(c) != STAGE_BREAK) return
        StatsStore.recordSkipped(c)
        AlarmScheduler.resolvePending(c)
        clear(c)
    }

    /**
     * Scores the break. Refuses to run twice for the same break, so a double tap cannot pay out twice.
     */
    fun commit(c: Context, glasses: Int, allowFromBreak: Boolean = false): JSONObject {
        val st = stage(c)
        if (st != STAGE_WATER && !(allowFromBreak && st == STAGE_BREAK)) {
            throw IllegalStateException("No break is waiting to be scored")
        }
        val p = sp(c)
        val exercise = exerciseId(c)
        val seconds = p.getInt(K_SECONDS, 0)
        val full = p.getBoolean(K_FULL, false)
        val g = glasses.coerceIn(0, 6)

        val r = Scoring.commit(c, seconds, exercise, full, g)
        val json = JSONObject()
            .put("xp", r.xp)
            .put("lines", JSONArray(r.lines))
            .put("levelBefore", r.levelBefore)
            .put("goalHit", r.goalHit)
            .put("badges", JSONArray(r.badges))
            .put("elapsed", seconds)
            .put("exerciseId", exercise)
            .put("glasses", g)

        p.edit().putString(K_STAGE, STAGE_REWARD).putString(K_REWARD, json.toString()).apply()
        return json
    }

    fun reward(c: Context): JSONObject? =
        sp(c).getString(K_REWARD, null)?.let { runCatching { JSONObject(it) }.getOrNull() }

    fun closeReward(c: Context) {
        if (stage(c) == STAGE_REWARD) clear(c)
    }

    fun clear(c: Context) {
        sp(c).edit()
            .remove(K_STAGE).remove(K_EXERCISE).remove(K_TOTAL).remove(K_BANKED).remove(K_RUN_RT)
            .remove(K_STARTED).remove(K_SECONDS).remove(K_FULL).remove(K_REWARD)
            .apply()
    }
}
