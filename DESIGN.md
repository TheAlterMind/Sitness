---
name: Sitness
description: A calm, offline movement-break companion for Android, tinted by one chosen accent.
colors:
  accent-violet: "#8E71E6"
  accent-teal: "#2FB6A0"
  accent-amber: "#D89C46"
  accent-coral: "#EA6A50"
  on-accent: "#0B0814"
  dark-bg: "#0E0B17"
  dark-surface: "#26232E"
  dark-well: "#19181E"
  dark-track: "#3C3B41"
  dark-text: "#E9E8EE"
  dark-dim: "#98979D"
  light-bg: "#F4F6F7"
  light-surface: "#FFFFFF"
  light-well: "#E8EEF0"
  light-track: "#DEE6E9"
  light-text: "#111A1F"
  light-dim: "#5F6E79"
  light-accent-text-violet: "#7960C3"
typography:
  timer:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "4rem"
    fontWeight: 400
    lineHeight: 1
  hero:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 500
    lineHeight: 1
  headline:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.625rem"
    fontWeight: 500
  title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 500
    lineHeight: 1.2
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.08em"
rounded:
  card: "16px"
  sheet: "16px 16px 0 0"
  round: "50%"
spacing:
  page: "18px"
  card: "16px"
  gap: "12px"
components:
  button-primary:
    backgroundColor: "{colors.accent-violet}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.card}"
    height: "48px"
  button-tonal:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-text}"
    rounded: "{rounded.card}"
    height: "48px"
  card:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-text}"
    rounded: "{rounded.card}"
    padding: "16px"
  chip-counter:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-text}"
    rounded: "{rounded.card}"
    padding: "11px 12px"
  icon-tile:
    backgroundColor: "{colors.dark-well}"
    textColor: "{colors.dark-text}"
    rounded: "{rounded.card}"
    size: "38px"
---

# Design System: Sitness

## Overview

**Creative North Star: "The Desk Companion"**

Sitness should feel like something on your side: soft, rounded and warm in tone, never a drill sergeant. The dark theme is the home theme: a near-black page tinted a tenth of the way toward the chosen accent, with grey cards that carry a trace of it too. One accent does all the talking. The ring and the timer lead on Home; everything else recedes.

The system is flat and tonal. Depth comes from stepping between page, card, well and track greys, not from shadows. There is one corner radius, 16px, for every button, card, chip and sheet; only rings, dots and round buttons are circles. Light mode exists and is kept readable, but dark is where colour decisions are made.

The companion voice is a direction as well as a look: a greeting line on Home, "You're on a roll" on Stats, a thicker ring. Those lines and the heavier ring stroke are chosen but not yet built, so treat them as the next step for new work. Today's Home is quieter than this.

**Key Characteristics:**
- One accent at a time (violet, teal, amber or coral), tinting page, greys and text.
- A single 16px corner radius; circles only where the shape is a circle.
- Flat tonal layers, no shadows.
- Large tabular numerals for time and score.
- Screens sit side by side (Stats, Home, Settings) and slide in from their side.

## Colors

A near-black page with a faint accent tint, a slightly lighter card grey, and one saturated accent used sparingly.

### Primary
- **Violet Signal** (#8E71E6): the default accent. Ring fill, primary buttons, chip fill, selected states, switches, active dots and slider fill. Teal (#2FB6A0), amber (#D89C46) and coral (#EA6A50) replace it wholesale when chosen.

### Neutral
- **Tinted Night** (#0E0B17): dark page background, 90% black plus 10% accent.
- **Control Grey** (#26232E): cards, lists, sheets, the Home ring track, the Pause button.
- **Well** (#19181E): icon tiles, tonal buttons and the time-wheel band, one step below the cards.
- **Track Grey** (#3C3B41): empty progress bars, borders and inactive dots.
- **Soft White** (#E9E8EE): main text. **Dim Grey** (#98979D): captions and secondary text.
- **Light theme:** page #F4F6F7, cards #FFFFFF, well #E8EEF0, track #DEE6E9, text #111A1F, dim #5F6E79. The accent as text is darkened to reach 4.5:1 (violet #7960C3, teal #207E6E, amber #91692F, coral #B4523E).

The frontmatter lists the violet values. The other three accents recompute every dark grey from their hex (mixing formulas in `web/src/theme.ts`), so treat the greys as formulas, not fixed colours.

### Named Rules
**The One Accent Rule.** Exactly one accent is on screen. It marks progress, the primary action and what is selected; it is never decoration.
**The Tint Rule.** Every dark grey carries 5-10% of the accent. Never use a neutral grey that ignores it.
**The Dark-First Rule.** Colour changes apply to the dark theme only unless the owner says otherwise.

## Typography

**Display, Body and Label Font:** the device's system face (Roboto on Android), chosen by the user from ten options in Settings. Never hard-code a font name.

**Character:** plain and legible, with big tabular numerals doing the expressive work.

### Hierarchy
- **Timer** (400, up to 64px, line-height 1): the Home countdown, sized from the ring (cqw), so text and ring keep their proportions.
- **Hero** (500, 56px): the streak number on Stats.
- **Headline** (500, 26px) and **Title** (500, 22px): screen titles and the pinned title bar.
- **Body** (400, 14px, 1.4): exercise text, help text, list rows.
- **Label** (400, 12px, 0.08em tracking): captions, categories, tile labels. 12px is the floor.

### Named Rules
**The Tabular Rule.** Every changing number uses tabular figures so it does not jitter.

## Layout

A single centred column. Home, Break, Water and Reward are capped at 560px, Settings at 720px, and Stats at 1040px in two columns once the window is wide. Page padding is 18px, cards 16px inside, 12px between blocks. Everything is sized in `rem` and scales with the window; layout switches come from classes on `<html>` (`lw`, `lwide`, `lshort`), not media queries. Landscape phones put the ring or vessel left and controls right.

Navigation is spatial: Stats left of Home, Settings right, in the order of the header icons. There is no bottom menu.

## Elevation & Depth

Flat and tonal. There are no shadows. Depth is the step from page to card to well, plus a 1px track-grey border around the app on wide windows. An accent tint filling a chip is the only emphasis.

### Named Rules
**The Flat Rule.** Surfaces stay flat at rest and in motion; new depth comes from a tonal step, never a drop shadow.

## Shapes

One 16px radius for buttons, cards, chips, tiles, selectors, toasts and popups; bottom sheets round only their top corners. Rings, dots, the vessel and round steppers are true circles. Ring strokes use rounded caps.

## Components

### Buttons
- **Shape:** 16px radius, 48px high.
- **Primary:** accent fill with near-black text (#0B0814); Break now and the help sheet's "Got it".
- **Tonal:** Control Grey (dark) or Well (light) fill with normal text; Pause.
- **State:** a disabled row dims to 40% and its controls switch off.

### Chips (Home counters)
- **Style:** a card the same size as the buttons below it, with an icon and a number.
- **State:** an accent tint at 28% grows from the left toward the daily goal; at the goal the card turns the accent.

### Cards / Containers
- **Corner:** 16px. **Background:** Control Grey. **Padding:** 16px. **Shadow:** none.

### Inputs / Fields
- Antd Mobile switches, selectors and sliders re-skinned to the accent. The slider track is visible against the card in both themes; thumbs follow the finger, then glide to the nearest step.

### Navigation
- A pinned 56px title bar with a back arrow; header icons (?, Stats, Settings) are 44px plain buttons. Screens slide 0.32s with `cubic-bezier(0.22, 0.8, 0.24, 1)`; with reduce motion on they switch without sliding.

### Home ring
- A large ring fills toward the next break, with the timer and one contextual line inside. The ring's track is Control Grey.

## Do's and Don'ts

### Do:
- **Do** use `var(--accent)` for progress, the primary action and selection, and nothing else.
- **Do** keep every radius at 16px, unless the shape is a circle.
- **Do** tint any new grey with the accent, using the formulas in `web/src/theme.ts`.
- **Do** keep touch targets at least 44px.
- **Do** write messages in plain, kind words ("Couldn't save that setting. Please try again.").

### Don't:
- **Don't** add drop shadows or gradients.
- **Don't** add a bottom navigation bar; screens sit left and right of Home.
- **Don't** change the light theme's colours as a side effect of a dark-theme change.
- **Don't** put text under 12px.
- **Don't** shame or nag; the game layer rewards movement and never punishes.
