package com.sitness.app

import android.app.Application

class SitnessApp : Application() {
    override fun onCreate() {
        super.onCreate()
        ThemeUtil.applyNightMode(Prefs.theme(this))
    }
}
