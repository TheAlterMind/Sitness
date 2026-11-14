package com.sitness.app

data class Exercise(
    val id: String,
    val name: String,
    val category: String,
    val instruction: String,
    /** Never offered by the rotation; reachable only by swiping. */
    val manualOnly: Boolean = false
)

object Exercises {

    val ALL: List<Exercise> = listOf(
        Exercise("squats", "10 squats", "strength",
            "Feet shoulder-width. Sit back and down, chest up, heels planted."),
        Exercise("steps", "250 steps", "cardio",
            "Corridor, stairs, around the block. Anywhere but the chair."),
        Exercise("wallsit", "Wall sit for a minute", "strength",
            "Back flat against the wall, thighs parallel to the floor. Breathe."),
        Exercise("floor", "Lie on a hard flat surface", "recovery",
            "Flat on your back on the floor, arms at your sides. Let the spine settle.",
            manualOnly = true),
        Exercise("kickbacks", "10 kickbacks", "strength",
            "Hinge slightly, drive one heel back and up, squeeze. Swap legs."),
        Exercise("fascia", "Assorted stretches", "mobility",
            "Slow, long holds. Find what feels bound and breathe into it.")
    )

    val IDS: List<String> = ALL.map { it.id }

    fun byId(id: String): Exercise? = ALL.firstOrNull { it.id == id }

    fun indexOf(id: String): Int = ALL.indexOfFirst { it.id == id }.coerceAtLeast(0)

    /**
     * Picks the exercise for a break: whichever enabled, non-manual exercise has been
     * done least today, ties broken at random.
     */
    fun suggest(ctx: android.content.Context): Int {
        val enabled = Prefs.pool(ctx)
        val candidates = ALL.filter { !it.manualOnly && enabled.contains(it.id) }
        if (candidates.isEmpty()) return 0

        if (Prefs.rotation(ctx) == "random") {
            return indexOf(candidates.random().id)
        }

        val counts = candidates.associateWith { StatsStore.todayCount(ctx, it.id) }
        val min = counts.values.minOrNull() ?: 0
        val least = counts.filterValues { it == min }.keys.toList()
        return indexOf(least.random().id)
    }
}
