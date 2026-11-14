package com.sitness.app

import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.util.Calendar
import java.util.TimeZone

class ScheduleMathTest {

    private lateinit var originalZone: TimeZone

    @Before fun pinTimeZone() {
        originalZone = TimeZone.getDefault()
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"))
    }

    @After fun restoreTimeZone() = TimeZone.setDefault(originalZone)

    /** 2024-01-01 is a Monday, so the 5th is a Friday and the 8th the next Monday. */
    private fun at(day: Int, hour: Int, minute: Int, second: Int = 0): Long =
        Calendar.getInstance().apply {
            clear(); set(2024, Calendar.JANUARY, day, hour, minute, second)
        }.timeInMillis

    private val weekdays = setOf(
        Calendar.MONDAY, Calendar.TUESDAY, Calendar.WEDNESDAY, Calendar.THURSDAY, Calendar.FRIDAY
    )

    private fun office(interval: Int = 60) =
        ScheduleMath.Rules(interval, 9 * 60, 17 * 60, weekdays)

    private fun next(r: ScheduleMath.Rules, from: Long, paused: Long = 0L) =
        ScheduleMath.computeNext(r, from, paused)

    // ---------- the grid ----------

    @Test fun hourlyBreaksLandOnTheHour() {
        assertEquals(at(1, 11, 0), next(office(), at(1, 10, 0)))        // strictly after the slot we are on
        assertEquals(at(1, 11, 0), next(office(), at(1, 10, 30)))
        assertEquals(at(1, 11, 0), next(office(), at(1, 10, 59, 59)))
    }

    @Test fun theTimeNeverDependsOnWhenItWasWorkedOut() {
        // Rescheduling a minute after a slot or a minute before the next gives the same answer.
        assertEquals(next(office(), at(1, 10, 1)), next(office(), at(1, 10, 59)))
    }

    @Test fun oddIntervalsStayAnchoredToStartOfDay() {
        // 09:00, 09:55, 10:50, 11:45 ... the same every day.
        assertEquals(at(1, 10, 50), next(office(55), at(1, 10, 0)))
        assertEquals(at(1, 11, 45), next(office(55), at(1, 10, 50)))
        assertEquals(at(2, 10, 50), next(office(55), at(2, 10, 0)))
    }

    @Test fun beforeOpeningLandsOnOpeningTime() {
        assertEquals(at(1, 9, 0), next(office(), at(1, 7, 0)))
    }

    @Test fun theClosingMinuteIsStillASlot() {
        assertEquals(at(1, 17, 0), next(office(), at(1, 16, 30)))
        assertEquals(at(2, 9, 0), next(office(), at(1, 17, 0)))
    }

    @Test fun afterTheLastSlotRollsToNextMorning() {
        assertEquals(at(2, 9, 0), next(office(55), at(1, 16, 20)))     // 17:15 is past the window
    }

    @Test fun fridayEveningRollsToMonday() {
        assertEquals(at(8, 9, 0), next(office(), at(5, 17, 0)))
    }

    @Test fun weekendSkipsToMonday() {
        assertEquals(at(8, 9, 0), next(office(), at(6, 10, 0)))
    }

    @Test fun nineBreaksADayAtFiftyFiveMinutes() {
        var t = at(1, 8, 0)
        var count = 0
        while (true) {
            t = next(office(55), t)
            if (t >= at(2, 0, 0)) break
            count++
        }
        assertEquals(9, count)   // 09:00, 09:55 ... 16:20
    }

    // ---------- pausing ----------

    @Test fun pauseSkipsSlotsButNeverMovesTheGrid() {
        // Paused until 13:20: 11:00, 12:00 and 13:00 are skipped, the next one is still 14:00 on the dot.
        assertEquals(at(1, 14, 0), next(office(), at(1, 10, 10), paused = at(1, 13, 20)))
    }

    @Test fun aSlotExactlyAtTheEndOfAPauseIsKept() {
        assertEquals(at(1, 13, 0), next(office(), at(1, 10, 10), paused = at(1, 13, 0)))
    }

    @Test fun pausingTheRestOfTheDayResumesAtOpening() {
        assertEquals(at(2, 9, 0), next(office(), at(1, 10, 10), paused = at(2, 0, 1)))
    }

    // ---------- other windows ----------

    @Test fun overnightWindowOpensTodayNotTomorrow() {
        val night = ScheduleMath.Rules(55, 22 * 60, 6 * 60, emptySet())
        assertEquals(at(1, 22, 0), next(night, at(1, 12, 0)))
    }

    @Test fun overnightWindowKeepsItsGridAcrossMidnight() {
        val night = ScheduleMath.Rules(55, 22 * 60, 6 * 60, emptySet())
        assertEquals(at(1, 23, 50), next(night, at(1, 23, 0)))
        assertEquals(at(2, 0, 45), next(night, at(1, 23, 55)))
        assertEquals(at(2, 1, 40), next(night, at(2, 0, 45)))
    }

    @Test fun allDayWindowStillHonoursActiveDays() {
        val allDay = ScheduleMath.Rules(60, 0, 0, weekdays)
        assertEquals(at(8, 0, 0), next(allDay, at(5, 23, 30)))
        assertEquals(at(1, 10, 0), next(allDay, at(1, 9, 30)))
    }

    // ---------- windows ----------

    @Test fun windowBoundariesAreInclusive() {
        val r = office()
        assertTrue(ScheduleMath.isWithinWindow(r, at(1, 9, 0)))
        assertTrue(ScheduleMath.isWithinWindow(r, at(1, 17, 0)))
        assertFalse(ScheduleMath.isWithinWindow(r, at(1, 17, 1)))
        assertFalse(ScheduleMath.isWithinWindow(r, at(1, 8, 59)))
        assertFalse(ScheduleMath.isWithinWindow(r, at(6, 12, 0)))      // Saturday
    }

    @Test fun anOvernightWindowBelongsToTheDayItOpened() {
        val fridayNights = ScheduleMath.Rules(60, 22 * 60, 6 * 60, setOf(Calendar.FRIDAY))
        assertTrue(ScheduleMath.isWithinWindow(fridayNights, at(5, 23, 0)))   // Friday evening
        assertTrue(ScheduleMath.isWithinWindow(fridayNights, at(6, 1, 0)))    // Saturday small hours, Friday's window
        assertFalse(ScheduleMath.isWithinWindow(fridayNights, at(5, 1, 0)))   // Friday small hours, Thursday's window
        assertFalse(ScheduleMath.isWithinWindow(fridayNights, at(6, 23, 0)))  // Saturday evening
    }
}
