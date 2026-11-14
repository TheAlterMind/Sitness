package com.sitness.app

import androidx.appcompat.app.AppCompatDelegate

object ThemeUtil {

    /** Applies the user's light/dark/system choice to the whole app, which the page then reads back. */
    fun applyNightMode(mode: String) {
        val m = when (mode) {
            "light" -> AppCompatDelegate.MODE_NIGHT_NO
            "dark" -> AppCompatDelegate.MODE_NIGHT_YES
            else -> AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM
        }
        if (AppCompatDelegate.getDefaultNightMode() != m) AppCompatDelegate.setDefaultNightMode(m)
    }
}
