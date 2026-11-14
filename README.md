# Sitness

A movement-break reminder for Android. Every hour it tells you to stand up,
runs a five-minute break with one exercise, asks whether you drank, and scores
the result.

Everything is local. There is no network permission in the manifest at all — the
app physically cannot phone home. History lives in SharedPreferences on the device.

---

## Building the APK

You need **Android Studio** (free, Windows / macOS / Linux) and **Node.js 18 or newer**
(the screens are a web page that Gradle builds for you). No Mac required.

1. **File → Open**, select this `Sitness` folder, wait for Gradle to sync.
   Android Studio downloads the SDK and Gradle itself on first run. If it offers
   to upgrade the Android Gradle Plugin or Kotlin, accept.
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**. The first build also runs
   `npm install` and `npm run build` in `web/`, which needs internet once; later
   builds skip the web step unless something under `web/` changed.
3. The file appears at `app/build/outputs/apk/debug/app-debug.apk`

No Node on this machine? Build with `-PskipWeb` to reuse the bundle already in
`app/src/main/assets/web`. The bundle is generated and not checked in, so a fresh
clone needs Node for its first build.

**Onto the phone:** enable Developer options (Settings → About phone → tap Build
number seven times), turn on USB debugging, plug in, press Run. Or copy the APK
to the phone, tap it, and allow installation from unknown sources.

---

## First run

Android will delay or drop reminders unless you grant two things. The home screen
shows a banner when they are missing, and **Settings → Reliability** links straight
to them:

- **Alarms and reminders** — lets breaks fire on the exact minute
- **Battery optimisation** — stops Android sleeping the app

Notification permission is requested automatically.

---

## The three screens of a break

**Home** — a header with your level and title, and a large ring filling toward the next
break, with the countdown in the middle and a contextual line beneath it that says whatever
matters most: your combo, how close the next level is, or how many breaks are left to protect
your streak. Outside your hours the ring reads "Off hours" and the line gives the next break
time. Two chips sit just under the header, each the same size as the buttons below: breaks
today (clock) and water today (cup), icon plus number, with a soft accent fill that grows
towards the daily goal. Two buttons at the bottom: Break now, and Pause. Pause opens a sheet:
30 minutes, 1 hour, 2 hours, rest of today, or Turn off reminders (nothing until you turn them
back on). While paused the ring says Paused with when it ends ("until 14:30", or "until
tomorrow"), and the button reads Resume; while off, it reads Turn on.

**Moving between screens.** Stats sits to the left of Home and Settings to the right, in the
same order as the header icons (a **?** for the short "How it works" sheet, then Stats, then
Settings). There is no bottom menu. Every switch follows that layout: the screen slides in from
the side where it sits (Settings from the right, Stats from the left) and the old one leaves
the opposite way.

- On Home, **swipe left** for Settings and **swipe right** for Stats.
- The way back is the opposite swipe (swipe right on Settings, swipe left on Stats), the back
  arrow, a tap anywhere on the pinned title bar, or the system Back gesture.
- Swipes starting within 24px of a screen edge are left to Android's own back gesture, and a drag
  that starts on a slider, a selector or inside a sheet is never taken for a screen swipe.
- The header icons stay, so every screen is reachable without swiping. With "reduce motion" on,
  screens switch without sliding.

**Break** — a vessel that fills with liquid as the break elapses (five minutes by default). Below it, a
swipeable card carrying one exercise. The break opens on whichever exercise you
have done least today; swipe left or right to pick a different one. Pause and skip
are icons at the top. Done is a single button at the bottom.

**Water** — one question, a counter, Done.

**Reward** — XP counts up from zero, an itemised breakdown shows where it came
from, the level bar animates, and any badges you just unlocked appear as cards.

**Stats** — a hero card with the current streak (and your best), your level and title, and the
XP to the next level; six tiles (breaks done, average per active day, 30-day rate, best combo,
glasses, active days); exercise balance; the last seven days; and the badges, each with a mark
for earned or locked. Below are Export (a JSON copy) and Reset, which uses the same confirmation
as the one in Settings. A **?** on the hero card, and on Home, opens a short "How it works" sheet
that explains the rings, XP and levels, combo and streak.

---

## Exercises

Six, one per break:

| Exercise | Category | In the rotation |
|---|---|---|
| 10 squats | strength | yes |
| 250 steps | cardio | yes |
| Wall sit for a minute | strength | yes |
| Lie on a hard flat surface | recovery | **no — swipe only** |
| 10 kickbacks | strength | yes |
| Assorted stretches | mobility | yes |

The floor exercise is never suggested automatically but is always reachable by
swiping. Counts reset daily by default, so the rotation rebalances each morning;
turn off **Reset the rotation daily** to weigh all-time totals instead.

---

## Scoring

```
base 10   break completed
   +5     went the full duration        (toggleable)
   +5     exercised
   +4     per glass of water
   x      combo: +0.1 per consecutive break, capped at 2.0
   x      difficulty: casual 0.8 / standard 1.0 / hardcore 1.3
  +50     daily goal reached
  +5/day  streak bonus on top of it, per day of the streak, up to +100 (a 20-day streak)
  +100    streak milestone: 7 days     +300: 30 days     +1000: 100 days
```

The streak bonus and milestones are paid when the day's goal is reached, are not multiplied by
combo or difficulty, and are never taken back: a broken streak only resets the bonus to its start.

Tapping Done in under 30 seconds earns nothing and counts as a skipped break.

**Levels** cost `50 × (L-1) × L` cumulative XP — 100, 300, 600, 1000, 1500 — each
with a title from Desk Dweller up to Perpetual. **Streaks** count days you hit the
goal, with grace days so one bad day does not wipe the slate. Only days the schedule
runs can be missed, so a weekend off does not break a streak. **Combos** reset when
you skip or ignore a break. Snoozing does not. Twelve **badges** cover volume,
streaks, combos, hydration, variety and the floor exercise.

---

## Defaults

60-minute interval, 5-minute break, 09:55–17:55, Monday to Friday, 8 breaks a day,
8 glasses of water, standard scoring, violet accent, system theme.

**Limits the sliders enforce** (the app enforces them too, and a value saved under older limits
is brought back inside when it is read): remind every 15–60 minutes in steps of 5, break length
1–15 minutes, snooze length 1–30 minutes. A start of day equal to the end of day means all day,
and Settings then shows "All day" instead of a range.

**Dark theme colours.** Both follow the accent (computed in `web/src/theme.ts`; light mode is unchanged):

- *Page background* = 90% black + 10% accent.
- *Track grey* (empty progress bars, borders, dots) = 95% of `#383838` + 5% accent (violet `#3C3B41`).
- *Text* = `#EEEEEE` + 5% accent; *small text* = `#999999` + 5% accent (violet `#E9E8EE` and `#98979D`).
- *Well* (icon buttons, tonal buttons, time-wheel band) = `#131313` + 5% accent (violet `#19181E`).
- *Control grey* (Home ring track, Pause button, cards) = 95% of `#333333` + 5% accent, then darkened to 58.32% of its brightness.

| Accent | Hex | Background | Control grey |
|--------|---------|-----------|-----------|
| Violet | #8E71E6 | `#0E0B17` | `#202023` |
| Teal   | #2FB6A0 | `#051210` | `#1E2221` |
| Amber  | #D89C46 | `#161007` | `#23211E` |
| Coral  | #EA6A50 | `#170B08` | `#231F1F` |

**Breaks happen at fixed times.** The day starts at **Start of day** and a break is due every
*Remind me every* minutes from then, so the defaults (09:55 and 60 minutes) give 09:55, 10:55,
11:55 … 17:55. A different setup works the same way: start 09:00 with 55 minutes gives 09:00,
09:55, 10:50 … 16:20. The times are the same every day and **Settings → Your break times**
lists them. They depend only on your settings and the calendar, never on when you last
finished, snoozed or paused:

- **Pause** skips the slots inside the pause; the first slot after it is still on the grid.
- **Snooze** brings the same break back later and leaves every later slot where it was.
- Opening the app, leaving Settings, a reboot or an update never shifts anything.

**What happens when a break is due.** If the app is open in front of you, the break simply starts
(you are moved to the break screen when the countdown reaches zero). Otherwise you get a
notification to tap, or the full-screen takeover if **Take over the screen** is on. If you are still
on a Water or Reward screen, the break waits behind a notification rather than replacing it.

The default 09:55–17:55 at 60 minutes gives nine breaks a day (09:55 … 17:55), so the goal of 8
leaves one free miss. Each break uses part of its hour (the break itself, then water and the
reward screen), so the countdown after one starts a few minutes short of 60.

Settings are in collapsible groups (Rhythm, How it alerts you, During the break, Water, Goals and
scoring, Appearance, Reliability, Data; one open at a time, Rhythm first). A line pinned under the
title shows the effect of the interval and the day's hours as you change them, and a row that
depends on another says which setting to turn on. Sliders follow your finger smoothly and show
the nearest step as a live number; on release the thumb glides to that step and the value is
saved. Appearance also holds Interface size and Font (each option shown in its own typeface).
Where a setting is off, the rows that depend on it are dimmed, marked disabled for screen
readers and switched off, but still readable.

---

## Project layout

The app is split in two. **Kotlin owns everything that must work with the app closed or
that holds your data**: alarms, notifications, scoring, streaks, stats, settings storage and
the break in progress. **A React page built with [Ant Design Mobile](https://mobile.ant.design/)
draws every screen**, inside one WebView. The page can load nothing from the network (the
WebView blocks it, and the built page carries a Content-Security-Policy with
`connect-src 'none'`), and the only way it reaches the app is the `Native` bridge below.

```
app/src/main/java/com/sitness/app/
  MainActivity.kt        Hosts the WebView; reminder taps open straight into a break
  NativeBridge.kt        The one door the page uses: call(method, argsJson) -> JSON
  BreakSession.kt        The break in progress (break -> water -> reward), persisted
  SettingsSpec.kt        Every setting the page may change, with enforced limits
  SitnessApp.kt          Application: applies the theme
  Scoring.kt             Turns a finished break into XP and badges
  Gamification.kt        Levels, titles, badge catalogue
  Exercises.kt           The six exercises and the rotation
  Prefs.kt               Every setting and its default, one place
  StatsStore.kt          JSON history, streaks, per-exercise counters
  ScheduleMath.kt        Pure timing and day arithmetic (unit-tested, no Android)
  AlarmScheduler.kt      Alarms, snooze, pause; keeps the schedule across app opens
  AlarmReceiver.kt       Fires the reminder, chains the next
  ActionReceiver.kt      Notification snooze and skip
  BootReceiver.kt        Restores the schedule after reboot, update or clock change
  NotificationHelper.kt  Channels, sound, vibration, full-screen intent
  ThemeUtil.kt           Light / dark / system

web/src/
  App.tsx                Picks the screen from the app's state; Back handling; the slide between
                         Stats, Home and Settings (one order for taps, swipes and Back)
  bridge.ts              Typed wrapper over the Native bridge (mock in a browser)
  mock.ts                Stand-in for the app so the UI runs in a plain browser
  screens/               Home, Break, Water, Reward, Stats, Settings
  settingsSchema.ts      The settings screen, described as data
  swipe.ts               Horizontal screen swipes (edge guard, ignores sliders and sheets)
  errors.ts              Plain-language messages for failed calls; the raw error goes to the console
  resetStats.ts          The one "reset statistics" flow, shared by Stats and Settings
  fonts.ts, scale.ts     Font and interface-size preferences (kept on the page, per device)
  components/            Ring, Vessel (animated), BarChart, ChipCounter, HelpSheet, icons
  theme.ts, styles.css   Accent colours, light/dark tokens
```

### Layout at different sizes

The UI adapts to the space it gets, which matters for tablets, landscape phones and the browser
preview:

- **Phone portrait** is the base layout.
- **Wide windows** (tablet, desktop): the app is a centred column; Home, Break, Water and Reward
  stay phone-width, Settings is one comfortable column, Stats uses two columns from 880px, and
  bottom sheets stay phone-width instead of stretching across the window.
- **Landscape phones and other short screens**: Home puts the ring on the left and the status and
  buttons on the right; Break puts the vessel on the left and the exercise and Done on the right.
- **Small phones**: the ring and vessel shrink to fit the height instead of overlapping.

All of it is in `web/src/styles.css`, mostly the `html.lw`, `html.lwide` and `html.lshort` rules at
the end (see "Scaling" below for what those classes mean).

### Scaling with the screen

Everything is sized in `rem`, including Ant Design Mobile's own components (a build step,
`postcss-pxtorem`, converts their pixels), so the whole interface scales together: text, icons,
spacing, the ring and the vessel. `web/src/scale.ts` sets the root font size from the window:

- 16px up to an 800px-tall window, so a phone looks exactly as designed;
- above that it grows with the window (2% of its height, limited by 4.4% of its width, at most
  96px), so a 1440p screen gets about 1.8× and a 4K screen about 2.7×.

**Settings → Appearance → Interface size** (Smaller, Automatic, Larger, Largest) multiplies the automatic
size, for example on a 4K screen that already has its own scaling. It is remembered on that device only.

The layout switches (`lw` framed column, `lwide` two-column Stats, `lshort` side-by-side Home and
Break) are decided from the window measured in the same scaled units, not raw pixels. So a large
interface in a small window goes compact instead of overflowing. If you add CSS, write sizes in `px`
(they are converted) and avoid `@media` width and height rules; use those classes instead.

### Working on the UI

```
cd web
npm install
npm run dev        # http://localhost:5173, runs against the mock, no phone needed
npm run build      # type-checks, then writes the bundle into app/src/main/assets/web
```

In a browser the page talks to `mock.ts`; on the phone it talks to the real app. When you
add a bridge method, add it in three places: `NativeBridge.kt`, `bridge.ts`, and `mock.ts`.

---

## Tests

Scheduling, day and level arithmetic, and the setting limits have plain JVM unit tests in `app/src/test`. The
web side is type-checked by `npm run build` (or `npm run typecheck`).
From Android Studio, right-click the `test` folder and choose Run, or from a terminal:

```
gradlew :app:testDebugUnitTest
```

(if there is no `gradlew` yet, open the project in Android Studio once and let it
generate the wrapper.)

---

## Known limits

- Aggressive OEM battery managers (Xiaomi, Huawei, Samsung, OnePlus) can still
  kill background apps. If reminders stop, whitelist Sitness in the phone's own
  battery settings, not just Android's.
- The break screen appears over the lock screen only when **Take over the screen**
  is enabled; otherwise you get a notification to tap. On Android 14 and later the
  system can withhold the full-screen permission, in which case you still get the
  notification but not the takeover.
- If notifications are switched off for the app, reminders cannot reach you at all.
  The home screen shows a banner when that happens.
- Statistics are on-device only. Export writes a JSON copy to share, but there is no
  import yet. Android's own backup (`allowBackup`) may restore statistics after a
  reinstall or on a new phone; uninstalling by itself does not guarantee they are erased.
- Screen swipes are for touch only. With a mouse, use the header icons and the back arrow; mouse
  and pen drags on a slider thumb work as usual.
- The vessel animates only while the page is visible; the WebView is paused whenever the
  app is in the background, so it costs nothing when you are not looking at it.
- The screens need Android System WebView (present on every normal Android phone). Very
  old or disabled WebView versions may render the page badly; keep it updated in Play.
