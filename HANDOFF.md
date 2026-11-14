# Sitness handoff

Paste this file (or point the new chat at it) to continue. Nothing is committed: the folder is not a git repo.

## What the project is

`C:\Dev\Sitness` is an Android movement-break reminder app. A native Kotlin core owns alarms, notifications, scoring,
streaks, stats, settings and the break in progress. A React 18 + TypeScript + Vite + Ant Design Mobile page, in one
WebView, draws every screen. The only door between them is `window.Native.call(method, argsJson)`, implemented in
`NativeBridge.kt`; `web/src/bridge.ts` wraps it and `web/src/mock.ts` stands in for it in a browser.
The README describes the layout, build, defaults, scoring, scaling and known limits.

## Done this session

1. **Streak bonus XP** (`Gamification.kt`, `Scoring.kt`, `mock.ts`, `Reward.tsx`, README, `GamificationTest.kt`).
   Daily goal pays 50 + 5 x streak days (the streak part is capped at +100, reached on day 20), plus one-off
   milestones +100 at 7 days, +300 at 30, +1000 at 100. Not multiplied by combo or difficulty, never deducted.
   The reward screen lists "Streak · N days" and "Streak milestone · N days"; a milestone headline reads "7-day streak".
2. **Dark theme background** is 90% black + 10% accent (`#0E0B17` for violet), worked out from the accent at runtime in
   `web/src/theme.ts` (`darkBackground`). Native fallback is the same value in `res/values-night/colors.xml`.
3. **Dark menu bar, Home ring track and Pause button** share one grey: 95% of `#333333` + 5% accent (`#38363C` for violet),
   via `--menu-bg`, `--ring-track`, `--pause-bg` (`styles.css`, `theme.ts` `controlGrey`, `Ring.tsx`, `Home.tsx` class `pause`).
   Light mode is unchanged.

## Verified

- Kotlin compiles. All 31 JVM unit tests pass (DayMathTest 6, GamificationTest 8, ScheduleMathTest 17).
- A Node re-implementation of the scoring (not the Kotlin) passed 15 pace/invariant checks: level 40 takes about
  6.7 months at 8 breaks a day for a perfect player (old flat +50 bonus: 8.3 months).
- On the Pixel_10a emulator, real Kotlin through the bridge gave the expected XP and lines in: first goal (79 XP),
  streak 6->7 (223), same-day second break (38, no goal lines), 19->20 (188, cap), 29->30 (488), 99->100 (1188),
  2-day gap reset (93), one grace day continuing (143), and a weekend-equivalent case (days off set so Friday->Wednesday
  keeps the streak: "Streak · 6 days +30").
- The reward screen and Home were looked at in the real WebView (DevTools screenshots). Live colors read back as
  expected (page `rgb(14,11,23)`, menu/ring/Pause `rgb(56,54,60)`).
- Web: `cd web && npm run build` type-checks and writes the bundle into `app/src/main/assets/web`.

## Not verified

- The phone's status and navigation bars take the page color through `setChrome`; emulator screenshots of them are black,
  so this was never seen.
- Only the violet accent was looked at; teal, amber and coral should tint the same way.
- A real Friday-to-Monday gap on the real clock (the emulator's date cannot be changed: no root, the shell lacks
  SUGGEST_MANUAL_TIME_AND_ZONE). It rests on the `DayMath` unit test `weekendOffIsNotAMissedDay`.
- Nothing has run on a physical phone. `Scoring.commit` with real storage has no JVM test (Robolectric was ruled out).

## Small open points

- The thin top border of the menu bar is still the old grey `#26323A`.
- The "Export statistics as JSON" button on Stats shares the `tonal` style but keeps `#141C21`, so it differs from Pause.
- The launcher icon background is still `#0F1418`.

## How to build and test

- Gradle: `C:\Users\t.konstantinov\.gradle\wrapper\dists\gradle-8.7-bin\bhs2wmbdwecv87pi65oeuq5iu\gradle-8.7\bin\gradle.bat`
  (no wrapper in the project). Use `-PskipWeb` to reuse the built bundle; run `npm run build` in `web/` first when the web changed.
  Tests: `gradle -PskipWeb :app:testDebugUnitTest`. APK: `gradle -PskipWeb :app:assembleDebug`.
- `local.properties` (gitignored) points at `C:\Users\t.konstantinov\AppData\Local\Android\Sdk`.
- The sandbox blocks loopback, so Gradle and `adb` must run from a terminal tab (`run_in_terminal`), not Bash/PowerShell tools.
  Put long sequences in a `.ps1` file and run that.

## Emulator recipe (Pixel_10a, `emulator.exe -avd Pixel_10a -no-snapshot-load -no-snapshot-save`)

- Install: `adb install -r app\build\outputs\apk\debug\app-debug.apk`; launch `adb shell am start -W -n com.sitness.app/.MainActivity`.
- Dark mode: `adb shell cmd uimode night yes` (or `no`).
- Screenshots: `adb screencap` and the emulator's own come out black for the app. Instead forward the WebView DevTools socket
  (`adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>`, pid from `/proc/net/unix`) and use a small Node script
  over the Chrome DevTools Protocol (`Runtime.evaluate`, `Page.captureScreenshot`). Node 24 has a global `WebSocket`.
- Drive the real Kotlin from the page with `Native.call('getState', '[]')` etc. Keep each evaluation short: a long
  `setTimeout` inside `Runtime.evaluate` hung the page. Do waits in the shell.
- Seed a streak by writing `shared_prefs/sitness_stats.xml` with `run-as com.sitness.app` (JSON in `stats_json`; keys
  `profile.streak`, `profile.lastGoalDate` as `yyyy-MM-dd`, `profile.combo`), then restart the app: `StatsStore` caches in memory.
- Gotchas: force-stopping and relaunching immediately can crash the new process (a framework race, not the app); stop,
  wait 3-6 s, then `am start -W`. Wait a few seconds after changing a setting before force-stopping, or the async
  SharedPreferences write is lost. The page stops answering when the app is not in front (notification shade, Home key).
- State left on the emulator: it was cold-booted, is in dark mode, has "stay awake" on, and Sitness is installed with clean data.

## Likely next steps

- Rebuild and look at the other accents; decide whether to match the Export button and the menu border to the new grey.
- Try a physical phone.
- Offer to add the dark-theme colors to the README.
