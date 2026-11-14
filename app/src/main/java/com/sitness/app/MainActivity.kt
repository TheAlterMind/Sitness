package com.sitness.app

import android.Manifest
import android.annotation.SuppressLint
import android.app.KeyguardManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewFeature
import java.io.ByteArrayInputStream

/**
 * Hosts the whole UI: one WebView showing the bundled page. Everything the page may do goes
 * through [NativeBridge]; the page can load nothing from the network.
 */
class MainActivity : AppCompatActivity() {

    companion object {
        /** Sent by the reminder notification: open the app straight into a break. */
        const val ACTION_START_BREAK = "com.sitness.app.START_BREAK"
        private const val HOST = "appassets.androidplatform.net"
        private const val PAGE = "https://$HOST/assets/web/index.html"

        /**
         * True while the app is on screen and in front. When a break comes due in that state the
         * break opens straight away instead of waiting for a notification tap (see AlarmReceiver).
         */
        @Volatile var isInForeground = false
    }

    private lateinit var web: WebView

    private val notifPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        ThemeUtil.applyNightMode(Prefs.theme(this))
        super.onCreate(savedInstanceState)

        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain(HOST)
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        web = WebView(this).apply {
            setBackgroundColor(ContextCompat.getColor(this@MainActivity, R.color.bg))
            overScrollMode = WebView.OVER_SCROLL_NEVER
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                allowFileAccess = false
                allowContentAccess = false
                blockNetworkLoads = true
                setSupportZoom(false)
                textZoom = 100
            }
            // The page draws its own dark theme; do not let the WebView invert it a second time.
            if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
                WebSettingsCompat.setAlgorithmicDarkeningAllowed(settings, false)
            }
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                    if (request.url.host == HOST) assetLoader.shouldInterceptRequest(request.url)
                    else WebResourceResponse("text/plain", "utf-8", 403, "Blocked", emptyMap(), ByteArrayInputStream(ByteArray(0)))

                // Never navigate away from the bundled page.
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean =
                    request.url.host != HOST

                override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                    recreate()
                    return true
                }
            }
            addJavascriptInterface(NativeBridge(this@MainActivity), "Native")
        }
        setContentView(web)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                // The page decides whether Back closes a sub-screen; if it does not, leave the app.
                web.evaluateJavascript("(window.nativeBack ? window.nativeBack() : false)") { handled ->
                    if (handled != "true") finish()
                }
            }
        })

        web.loadUrl(PAGE)

        requestNotificationPermission()
        // Keep the existing schedule: opening the app must not push the next break back.
        AlarmScheduler.ensureScheduled(this)

        // A recreated activity still holds the original intent; only a fresh launch may act on it.
        if (savedInstanceState == null) handleIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleIntent(intent)
    }

    override fun onResume() {
        super.onResume()
        isInForeground = true
        web.onResume()
        StatsStore.refreshStreak(this)
        syncWindow()
        web.evaluateJavascript("window.nativeResume && window.nativeResume()", null)
    }

    override fun onPause() {
        super.onPause()
        isInForeground = false
        web.onPause()
    }

    override fun onDestroy() {
        isInForeground = false
        web.removeJavascriptInterface("Native")
        web.destroy()
        super.onDestroy()
    }

    private fun handleIntent(intent: Intent?) {
        if (intent?.action != ACTION_START_BREAK) return
        setIntent(Intent(this, MainActivity::class.java))      // consumed: a later recreate must not restart it
        NotificationHelper.cancel(this)
        AlarmScheduler.cancelNudge(this)
        BreakSession.start(this, manual = false)
        if (Prefs.fullscreen(this)) showOverLockScreen()
        syncWindow()
        web.evaluateJavascript("window.nativeResume && window.nativeResume()", null)
    }

    /** Over the lock screen only when the user asked the break to take over the screen. */
    private fun showOverLockScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
            (getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager).requestDismissKeyguard(this, null)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
    }

    /** Keeps the screen awake during a break if the user wants that. */
    fun syncWindow() = runOnUiThread {
        val breaking = BreakSession.stage(this) == BreakSession.STAGE_BREAK
        if (breaking && Prefs.keepAwake(this)) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    /** True when the app is showing in night mode, after the user's theme choice has been applied. */
    fun isDark(): Boolean =
        (resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES

    /** The page tells us its background so the status and navigation bars match it. */
    fun setChrome(hex: String, darkIcons: Boolean) = runOnUiThread {
        runCatching {
            val color = Color.parseColor(hex)
            window.statusBarColor = color
            window.navigationBarColor = color
            web.setBackgroundColor(color)
            WindowInsetsControllerCompat(window, window.decorView).apply {
                isAppearanceLightStatusBars = darkIcons
                isAppearanceLightNavigationBars = darkIcons
            }
        }
    }

    fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val ok = ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) ==
                PackageManager.PERMISSION_GRANTED
            if (!ok) notifPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }
}
