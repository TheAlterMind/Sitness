package com.sitness.app

import org.junit.Assert.assertEquals
import org.junit.Test

class GamificationTest {

    @Test fun levelThresholdsMatchTheReadme() {
        assertEquals(listOf(0, 100, 300, 600, 1000, 1500), (1..6).map { Gamification.xpForLevel(it) })
    }

    @Test fun levelForSitsOnTheBoundaries() {
        assertEquals(1, Gamification.levelFor(0))
        assertEquals(1, Gamification.levelFor(99))
        assertEquals(2, Gamification.levelFor(100))
        assertEquals(2, Gamification.levelFor(299))
        assertEquals(3, Gamification.levelFor(300))
    }

    @Test fun progressReportsPositionInsideTheLevel() {
        assertEquals(Triple(2, 50, 200), Gamification.progress(150))
    }

    @Test fun comboAddsATenthPerBreakAndCapsAtTwo() {
        assertEquals(1.0, Gamification.comboMultiplier(0), 1e-9)
        assertEquals(1.0, Gamification.comboMultiplier(1), 1e-9)
        assertEquals(1.1, Gamification.comboMultiplier(2), 1e-9)
        assertEquals(2.0, Gamification.comboMultiplier(11), 1e-9)
        assertEquals(2.0, Gamification.comboMultiplier(50), 1e-9)
    }

    @Test fun streakBonusGrowsFivePerDayAndCapsAtTwentyDays() {
        assertEquals(0, Gamification.streakBonus(0))
        assertEquals(5, Gamification.streakBonus(1))
        assertEquals(60, Gamification.streakBonus(12))
        assertEquals(100, Gamification.streakBonus(20))
        assertEquals(100, Gamification.streakBonus(200))
    }

    @Test fun milestonesPayOnlyOnTheExactDay() {
        assertEquals(listOf(0, 100, 0, 300, 0, 1000, 0),
            listOf(6, 7, 8, 30, 31, 100, 101).map { Gamification.milestoneBonus(it) })
    }

    @Test fun titlesRunFromDeskDwellerToPerpetual() {
        assertEquals("Desk Dweller", Gamification.title(1))
        assertEquals("Fidgeter", Gamification.title(3))
        assertEquals("Perpetual", Gamification.title(40))
    }

    @Test fun everyBadgeHasAUniqueId() {
        assertEquals(12, Gamification.CATALOG.size)
        assertEquals(12, Gamification.CATALOG.map { it.id }.toSet().size)
    }
}
