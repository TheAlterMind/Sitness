# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users
A single person (the author), working long stretches at a desk, who wants to be nudged to stand up and move on a reliable schedule. Not planned for public release. Phone use is glanceable: a notification, a short break, back to work.

## Product Purpose
Sitness is a movement-break reminder for Android. At fixed times it prompts a break, runs a timed break with one exercise, asks whether the user drank water, and scores the result with XP, levels, streaks, combos and badges. Success is breaks actually taken, on time, day after day.

## Positioning
Fully offline and game-like, with a strict schedule. The manifest has no network permission, so the app cannot phone home; history stays on the device. Breaks fall on a fixed grid of times (start of day plus the interval) that does not drift with pause, snooze, reboot or app updates, and the scoring rewards real movement rather than opening the app.

## Operating Context
Reminders arrive through exact alarms and notifications (Start / Snooze / Skip), optionally a full-screen takeover over the lock screen. Reliability depends on notification, exact-alarm and battery-optimisation permissions. Kotlin owns everything that must work with the app closed (alarms, scoring, stats, settings storage, the break in progress). A React and Ant Design Mobile page draws every screen in one WebView and reaches the app only through the `Native` bridge; it can load nothing from the network.

## Capabilities and Constraints
- Screens: Home (ring, countdown, Break now, Pause), Break, Water, Reward, Stats, Settings. Stats sits left of Home and Settings right; swipes and the header icons follow that order.
- Six exercises, one per break; one (floor) is swipe-only.
- Settings limits: remind every 15-60 min (step 5), break 1-15 min, snooze 1-30 min.
- Four accents (violet, teal, amber, coral), light and dark themes, interface size and font options.
- Debug APK only; release builds are unsigned and no keystore exists. Decision on signing is open.
- Statistics are on-device; export is JSON, no import.
- Not yet verified on the real phone: behaviour under Doze and battery saver.

## Brand Commitments
Name: Sitness. Level titles run from Desk Dweller to Perpetual. Colour changes apply to the dark theme only unless the owner says otherwise.

## Evidence on Hand
README.md describes the screens, scoring and defaults; `.impeccable/critique/` holds a 2026-11-14 critique. No user research, testimonials or store assets exist and none should be invented.

## Product Principles
1. Reliable before clever: a reminder that arrives on time beats any feature.
2. Private by construction: nothing leaves the device, and the app should never need to ask.
3. Quick to act on: a break should start in one tap, without decisions.
4. Reward movement, not attention: the game layer must never nag or punish.
5. Say what is wrong plainly, in everyday words.
