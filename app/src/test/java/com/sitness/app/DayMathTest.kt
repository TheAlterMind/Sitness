package com.sitness.app

import org.junit.Assert.assertEquals
import org.junit.Test
import java.util.Calendar

class DayMathTest {

    private val weekdays = setOf(
        Calendar.MONDAY, Calendar.TUESDAY, Calendar.WEDNESDAY, Calendar.THURSDAY, Calendar.FRIDAY
    )

    // 2024-01-05 is a Friday, 2024-01-08 the following Monday.

    @Test fun weekendOffIsNotAMissedDay() {
        assertEquals(0, DayMath.activeDaysBetween("2024-01-05", "2024-01-08", weekdays))
    }

    @Test fun aMissedWeekdayIsCounted() {
        assertEquals(1, DayMath.activeDaysBetween("2024-01-05", "2024-01-09", weekdays))
    }

    @Test fun emptyDaySetMeansEveryDay() {
        assertEquals(2, DayMath.activeDaysBetween("2024-01-05", "2024-01-08", emptySet()))
    }

    @Test fun adjacentAndSameDaysHaveNothingBetween() {
        assertEquals(0, DayMath.activeDaysBetween("2024-01-05", "2024-01-06", emptySet()))
        assertEquals(0, DayMath.activeDaysBetween("2024-01-05", "2024-01-05", emptySet()))
    }

    @Test fun daysBetweenCountsCalendarDays() {
        assertEquals(3, DayMath.daysBetween("2024-01-05", "2024-01-08"))
        assertEquals(1, DayMath.daysBetween("2024-02-28", "2024-02-29"))
        assertEquals(2, DayMath.daysBetween("2024-02-28", "2024-03-01"))
    }

    @Test fun unreadableKeysAreTreatedAsALongGap() {
        assertEquals(999, DayMath.daysBetween("nonsense", "2024-01-05"))
        assertEquals(999, DayMath.activeDaysBetween("2024-01-05", "", weekdays))
    }
}
