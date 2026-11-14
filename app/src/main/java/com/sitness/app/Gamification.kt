package com.sitness.app

import android.content.Context

data class Badge(val id: String, val name: String, val description: String)

object Gamification {

    /** Cumulative XP to reach a level: 50 * (L-1) * L → 0, 100, 300, 600, 1000... */
    fun xpForLevel(level: Int) = 50 * (level - 1) * level

    fun levelFor(xp: Int): Int {
        var l = 1
        while (xpForLevel(l + 1) <= xp && l < 200) l++
        return l
    }

    /** level, xp into this level, xp span of this level */
    fun progress(xp: Int): Triple<Int, Int, Int> {
        val l = levelFor(xp)
        val floor = xpForLevel(l)
        val ceil = xpForLevel(l + 1)
        return Triple(l, xp - floor, ceil - floor)
    }

    fun title(level: Int): String = when {
        level < 2 -> "Desk Dweller"
        level < 4 -> "Fidgeter"
        level < 7 -> "Stretcher"
        level < 11 -> "Mover"
        level < 16 -> "Strider"
        level < 22 -> "Pacer"
        level < 30 -> "Kinetic"
        level < 40 -> "Relentless"
        else -> "Perpetual"
    }

    fun difficultyMultiplier(c: Context): Double = when (Prefs.difficulty(c)) {
        "casual" -> 0.8
        "hardcore" -> 1.3
        else -> 1.0
    }

    fun comboMultiplier(combo: Int): Double =
        (1.0 + 0.1 * (combo - 1).coerceAtLeast(0)).coerceAtMost(2.0)

    const val GOAL_BONUS = 50

    /** Extra XP per day of the streak, added to the goal bonus, and the most it can add. */
    const val STREAK_STEP = 5
    const val STREAK_BONUS_CAP = 100       // reached at a 20-day streak: 50 + 100 = 150 in all

    /** The streak part of the daily goal bonus. [streakDays] counts the day just completed. */
    fun streakBonus(streakDays: Int): Int =
        (STREAK_STEP * streakDays.coerceAtLeast(0)).coerceAtMost(STREAK_BONUS_CAP)

    /** One-off reward for reaching exactly this many days in a row; 0 for every other length. */
    fun milestoneBonus(streakDays: Int): Int = when (streakDays) {
        7 -> 100
        30 -> 300
        100 -> 1000
        else -> 0
    }

    val CATALOG: List<Badge> = listOf(
        Badge("first", "Ice Breaker", "Finish your first break"),
        Badge("ten", "Getting Loose", "Finish 10 breaks"),
        Badge("fifty", "Habit Forming", "Finish 50 breaks"),
        Badge("combo5", "On a Roll", "5 breaks back to back"),
        Badge("combo10", "Unbroken", "10 breaks back to back"),
        Badge("streak3", "Three in a Row", "Hit your goal 3 days running"),
        Badge("streak7", "Full Week", "Hit your goal 7 days running"),
        Badge("water", "Well Watered", "Hit your water goal in a day"),
        Badge("perfect", "Clean Sheet", "Every break in a day, none skipped"),
        Badge("hour", "First Hour", "60 minutes of breaks in total"),
        Badge("rounded", "Well Rounded", "Try all six exercises"),
        Badge("floorbadge", "Flat Out", "Lie on the floor 10 times")
    )

    fun byId(id: String) = CATALOG.firstOrNull { it.id == id }

    /** Re-evaluates every badge, returns those newly unlocked. */
    fun evaluate(c: Context): List<Badge> {
        val out = ArrayList<Badge>()
        fun tryUnlock(id: String, condition: Boolean) {
            if (condition && StatsStore.unlock(c, id)) byId(id)?.let { out.add(it) }
        }

        val total = StatsStore.totalBreaks(c)
        val today = StatsStore.today(c)

        tryUnlock("first", total >= 1)
        tryUnlock("ten", total >= 10)
        tryUnlock("fifty", total >= 50)
        tryUnlock("combo5", StatsStore.combo(c) >= 5)
        tryUnlock("combo10", StatsStore.combo(c) >= 10)
        tryUnlock("streak3", StatsStore.streak(c) >= 3)
        tryUnlock("streak7", StatsStore.streak(c) >= 7)
        tryUnlock("water", Prefs.waterGoal(c) > 0 && today.water >= Prefs.waterGoal(c))
        tryUnlock("perfect", today.completed >= Prefs.dailyGoal(c) && today.skipped == 0 && today.missed == 0)
        tryUnlock("hour", StatsStore.totalSeconds(c) >= 3600)
        tryUnlock("rounded", Exercises.IDS.all { StatsStore.totalCount(c, it) > 0 })
        tryUnlock("floorbadge", StatsStore.totalCount(c, "floor") >= 10)

        return out
    }
}
