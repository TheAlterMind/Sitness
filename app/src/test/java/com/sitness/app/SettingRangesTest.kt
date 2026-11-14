package com.sitness.app

import org.junit.Assert.assertEquals
import org.junit.Test

/** Values saved under older, wider limits must come back inside the current ones. */
class SettingRangesTest {

    @Test fun intervalIsClampedToFifteenToSixty() {
        assertEquals(15, 5.coerceIn(Prefs.INTERVAL_RANGE))
        assertEquals(15, 10.coerceIn(Prefs.INTERVAL_RANGE))
        assertEquals(60, 90.coerceIn(Prefs.INTERVAL_RANGE))
        assertEquals(60, 180.coerceIn(Prefs.INTERVAL_RANGE))
        assertEquals(45, 45.coerceIn(Prefs.INTERVAL_RANGE))
    }

    @Test fun breakLengthIsClampedToOneToFifteen() {
        assertEquals(1, 0.coerceIn(Prefs.BREAK_RANGE))
        assertEquals(15, 30.coerceIn(Prefs.BREAK_RANGE))
        assertEquals(5, 5.coerceIn(Prefs.BREAK_RANGE))
    }

    @Test fun snoozeLengthIsClampedToOneToThirty() {
        assertEquals(1, 0.coerceIn(Prefs.SNOOZE_RANGE))
        assertEquals(30, 60.coerceIn(Prefs.SNOOZE_RANGE))
        assertEquals(10, 10.coerceIn(Prefs.SNOOZE_RANGE))
    }
}
