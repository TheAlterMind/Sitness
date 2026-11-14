package com.sitness.app

import android.content.Context

/** What a finished break earned, ready to hand to the reward screen. */
class BreakResult(
    val xp: Int,
    val lines: ArrayList<String>,   // "label|value"
    val levelBefore: Int,
    val goalHit: Boolean,
    val badges: ArrayList<String>
)

object Scoring {

    /** Tapping Done sooner than this earns nothing and counts as a skipped break. */
    const val MIN_SECONDS = 30

    /**
     * Applies a completed break to the stats and returns what it earned.
     * Called once, from the water screen, after the user confirms their glasses.
     */
    fun commit(
        c: Context,
        elapsedSeconds: Int,
        exerciseId: String,
        fullDuration: Boolean,
        glasses: Int
    ): BreakResult {

        val levelBefore = Gamification.levelFor(StatsStore.xp(c))

        if (elapsedSeconds < MIN_SECONDS) {
            StatsStore.recordSkipped(c)
            return BreakResult(0, arrayListOf("Too quick to count|+0"), levelBefore, false, ArrayList())
        }

        val lines = ArrayList<String>()

        var base = 10
        lines.add("Break completed|+10")

        if (fullDuration && Prefs.fullBonus(c)) {
            base += 5
            lines.add("Full duration|+5")
        }

        base += 5
        lines.add("Exercised|+5")

        if (glasses > 0) {
            val w = 4 * glasses
            base += w
            lines.add("Water · $glasses glass${if (glasses > 1) "es" else ""}|+$w")
        }

        val combo = StatsStore.combo(c) + 1
        val cm = Gamification.comboMultiplier(combo)
        val dm = Gamification.difficultyMultiplier(c)
        var earned = Math.round(base * cm * dm).toInt()

        if (cm > 1.0) lines.add("Combo x$combo|x${String.format("%.1f", cm)}")
        if (dm != 1.0) lines.add("Difficulty|x$dm")

        StatsStore.recordCompleted(c, elapsedSeconds, exerciseId, glasses, earned)

        var goalHit = false
        val today = StatsStore.today(c)
        if (today.completed >= Prefs.dailyGoal(c) && !today.goalMet) {
            StatsStore.markGoalMet(c)
            val streak = StatsStore.streak(c)
            val streakXp = Gamification.streakBonus(streak)
            val milestoneXp = Gamification.milestoneBonus(streak)
            val bonus = Gamification.GOAL_BONUS + streakXp + milestoneXp
            StatsStore.addXp(c, bonus)
            earned += bonus
            goalHit = true
            lines.add("Daily goal reached|+${Gamification.GOAL_BONUS}")
            if (streakXp > 0) lines.add("Streak · $streak day${if (streak > 1) "s" else ""}|+$streakXp")
            if (milestoneXp > 0) lines.add("Streak milestone · $streak days|+$milestoneXp")
        }

        val badges = ArrayList<String>()
        Gamification.evaluate(c).forEach { badges.add(it.id) }

        return BreakResult(earned, lines, levelBefore, goalHit, badges)
    }
}
