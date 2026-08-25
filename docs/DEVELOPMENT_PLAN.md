# Autolearn — Development Plan

Goal: take the current prototype to a feature-complete, App Store / Play Store-ready
release. This document is the working plan for AI-assisted development: phases are
ordered, tasks are sized to be completable in a single focused session, and each has
acceptance criteria. Update checkboxes and notes as work lands.

## Product definition

Autolearn is a passive language-learning app: the user builds a list of term/definition
pairs and listens to them as spoken audio (term in the source language, definition in
the target language) while doing something else. The core value is hands-off, repeated
audio exposure — not quizzes or gamification.

Feature-complete for v1.0 means:

1. Manage vocabulary pairs (add, edit, delete, deactivate) with per-pair languages.
2. Robust playback: play/pause/stop, loop, shuffle, adjustable rate and pause between
   pairs, timed sessions, and repeat-count per pair.
3. Language & voice settings (device voices via `Speech.getAvailableVoicesAsync`).
4. Progress tracking surfaced in the UI (`timesListened`, `familiarity` already exist
   in the data model but are unused).
5. Polished, themed UI with dark mode, empty states, and onboarding.
6. Store-ready: EAS build/submit config, icons/splash (already present), versioning,
   privacy policy, beta testing round.

Explicit non-goals for v1.0 (decision points — revisit before v1.1):

- Accounts / cloud sync (all data stays on device; simplifies privacy story).
- Auto-translation of entered terms (needs a backend or API key handling).
- Full spaced-repetition scheduling (the `familiarity` field enables a simple version;
  a real SRS algorithm is v1.1+).
- Monetization.

## Current state (August 2026)

> **Phase 1 landed (Aug 25, 2026).** The snapshot below describes the repo _before_
> Phase 1; it is kept for context. Since then: the store lives in
> `src/state/store.ts` with CRUD actions and id-keyed pairs (storage version 1 with
> migration), `use-immer`/`Colors.ts`/dead code are gone, and ESLint (flat config +
> prettier plugin, mirroring UltimateAchiever), prettier, and jest-expo are set up
> with store tests passing.

- Expo SDK 57, React Native 0.86, React 19, New Architecture, expo-router (single
  route), Zustand 5 + AsyncStorage persistence, `use-immer` for local list state.
- One screen: `src/app/index.tsx` (~290 lines) contains input fields, the list, all
  playback logic, and shuffle/timer controls. `src/components/CollapsiblePair.tsx` is
  the only extracted component.
- `src/state/AppContext.tsx` defines the store; `src/state/types.ts` has `Pair` with
  `status` and `familiarity` fields that nothing uses yet.
- `src/constants/Colors.ts` is an unused template leftover; styling is inline
  hardcoded hex values, light mode only.
- No tests, no ESLint config (the `lint` script exists but `eslint-config-expo` was
  dropped during the SDK 57 upgrade), no prettier config, no `eas.json`, no CI.
- README predates the Zustand migration and mentions removed libraries.

### Known bugs (fix before building features on top)

- [x] **Delete after shuffle removes the wrong pair.** `deletePair(index)` splices
      `savedPairList` using the index from the rendered (possibly shuffled) `pairList`.
      Root cause: two sources of truth. Fix by giving each `Pair` a stable `id` and
      keying all operations (delete, edit, toggle, keyExtractor) on it.
- [x] **Duplicated list state.** Local `pairList` (immer) shadows the store's
      `savedPairList` and they sync manually at hydration/stop. Consolidate: the store
      owns the data; the screen owns only view state (shuffle order as an id array,
      expanded row, playback status).
- [x] **Hydration is polled** with a 50 ms `setInterval` checking
      `useAppStore.persist.hasHydrated()`. Use `persist.onFinishHydration` or render
      directly from the store so no sync is needed at all.
- [x] **`timesListened` updates are lost** unless playback is stopped via the stop
      button (writes happen to the local copy and only persist in `stopPlayback`).
- [x] **Timer input is unvalidated** — `Number('')` → 0, non-numeric input → `NaN`,
      making the timed-session cutoff silently wrong.
- [x] **Playback loop is fragile.** Restart is a side effect of a `useEffect` watching
      `wordsLeft`, with per-word `onDone` callbacks closing over stale state. Replace
      with an explicit playback engine (Phase 2). _Phase 1 note: mitigated —
      listen-count callbacks now go through `useAppStore.getState()` so they can't go
      stale, and the restart effect carries eslint-disable markers pointing at the
      Phase 2 replacement. The effect-driven loop itself still exists until Phase 2._
- [x] **Deprecated `SafeAreaView`** imported from `react-native`; use
      `react-native-safe-area-context` (already installed).
- [x] **`keyExtractor` uses list index**; breaks row identity under shuffle/delete.
- [x] Dead code: commented-out Test/Reset buttons in `index.tsx`, unused
      `loadStoredState` action, unused `Colors.ts`, many unused styles copied between
      files.

## Phase 1 — Foundation & hygiene

Everything later builds on this. No user-visible changes except bug fixes.

- [x] Restore tooling: `npx expo lint` (installs/configures ESLint flat config),
      prettier config committed (note: current code is formatted with prettier
      defaults — double quotes; pick a config and format the whole repo once).
- [x] Add `jest-expo` + `@testing-library/react-native`; wire `test` script.
- [x] Introduce stable `id` on `Pair` (e.g. `expo-crypto` randomUUID) with a
      persistence migration (zustand `persist` `version` + `migrate`) for existing
      stored data.
- [x] Fix all Known bugs above; delete dead code. Store logic gets unit tests
      (add/update/delete/migration).
- [x] Restructure state: `savedPairList` → store-owned CRUD actions
      (`addPair`, `updatePair`, `deletePair`, `incrementTimesListened`); screen-local
      view state only. Remove `use-immer` if it no longer earns its place (zustand
      supports an immer middleware if draft-style updates are wanted).
- [x] Rewrite README to match reality (Zustand, @expo/vector-icons, SDK 57) and link
      this plan. Expand `AGENTS.md` with project conventions (folder layout, store
      patterns, testing expectations) so future AI sessions stay consistent.

Acceptance: `expo lint`, `tsc --noEmit`, and `bun test` all pass; delete-after-shuffle
works; app behaves identically otherwise.

## Phase 2 — Playback engine

The core of the product; isolate it from UI.

- [x] Extract a `usePlayback` hook (or small state machine module) that owns: the
      queue (ordered pair ids), current position, status
      (`idle | playing | paused | stopped`), loop mode, session timer, and rate. It
      speaks one pair at a time (term → configurable gap → definition → gap) instead
      of enqueueing the entire list into expo-speech at once — this makes
      pause/resume/skip possible and keeps callbacks fresh.
- [x] Playback settings (persisted in the store): rate (currently hardcoded 0.8),
      gap between pairs, repeats per pair, loop on/off, shuffle-each-loop on/off.
- [x] Timed sessions: validated minutes input, countdown surfaced in the UI, clean
      stop at expiry.
- [x] `incrementTimesListened` fires per completed pair directly against the store
      (survives app kill mid-session).
- [x] Decision point: **background audio.** expo-speech does not keep speaking when
      the app is backgrounded on iOS. Options: (a) v1.0 ships foreground-only with
      keep-awake (`expo-keep-awake`) and is honest about it; (b) investigate an iOS
      background-audio session (`UIBackgroundModes: [audio]` + expo-audio silent
      session) — spike this in a branch before committing. Recommendation: ship (a),
      spike (b) for v1.1, since "while you go about your day" is the app's promise.
      _Decision (Aug 25, 2026): went with (a) — the engine holds a keep-awake lock
      (tag `autolearn-playback`) while playing and releases it on pause/stop. Spike
      (b) stays on the v1.1 list._
- [x] Unit tests for the queue/state machine (mock `expo-speech`).

Acceptance: play, pause, resume, skip, stop, loop, and timed sessions all work; killing
the app never loses listen counts; no `useEffect`-driven playback restarts remain.

## Phase 3 — Features

- [ ] **Settings screen** (new route): default source/target languages, voice picker
      per language (`Speech.getAvailableVoicesAsync`), playback defaults, data export.
      Languages are currently hardcoded `es`/`en` in the store with no UI.
- [ ] **Pair management:** edit existing pairs (term, definition, languages), swap
      term/definition direction, toggle `status` active/inactive (inactive pairs are
      skipped in playback but kept in the list), swipe-to-delete with undo.
- [ ] **Familiarity:** simple v1 — a manual 0–5 rating per pair plus an automatic
      nudge from `timesListened`; playback option "prioritize least familiar" that
      weights the shuffle. (Full SRS is out of scope for v1.0.)
- [ ] **Stats:** lightweight — per-pair listen counts already exist; add a small
      summary (total pairs, total listens, listens this week) on the main screen or
      settings. Not a full dashboard.
- [ ] **Import/export:** CSV/JSON export via share sheet, CSV import (unblocks users
      with existing word lists; also the de-facto backup story given no cloud sync).
- [ ] **Empty state & onboarding:** first-launch explanation of the passive-listening
      concept, sample starter pairs offered per language pair.

Acceptance: a new user can install, pick languages, add or import vocabulary, listen,
and see progress without touching code or defaults.

## Phase 4 — Design & UX

The app currently looks like a prototype (hardcoded greys, default header, no dark
mode). Do this after features so the design pass covers real screens.

- [ ] Design tokens: single theme module (colors incl. dark variants, spacing,
      typography, radii) replacing all inline hex values; delete or repurpose
      `Colors.ts`. Follow platform semantics (see `expo-native-ui` / `expo-design-system`
      skills when implementing).
- [ ] Dark mode: `userInterfaceStyle` is already `automatic`; make the theme respond
      (`useColorScheme`), fix the hardcoded `StatusBar style="dark"` and icon colors.
- [ ] Adopt native components where they fit (`@expo/ui` is already installed):
      bottom sheet for add/edit pair, native pickers for language/voice, SF Symbols
      via `expo-symbols` on iOS.
- [ ] Main screen layout: proper header, prominent play control, readable list rows
      (current rows are cramped 4 px-padding cards), animation polish
      (react-native-reanimated is installed) and haptics on key actions.
- [ ] Accessibility: labels on all icon-only buttons (shuffle/play/delete currently
      have none), dynamic type, contrast check on the final palette.
- [ ] App icon/splash review on device (assets exist from the upgrade; verify they are
      the intended branding, including the Android adaptive icon set).

Acceptance: no hardcoded colors outside the theme module; light and dark screenshots
look intentional; VoiceOver can operate every control.

## Phase 5 — Release

- [ ] Quality gate: error boundary at the root; decide on crash reporting (Sentry via
      `sentry-expo`) — recommended even for v1.0.
- [ ] Recreate `eas.json` (deleted during the upgrade) with development / preview /
      production profiles; confirm the EAS project link (`extra.eas.projectId` is set).
- [ ] CI: EAS Workflow or GitHub Action running lint + typecheck + tests on PRs.
- [ ] Store prep: bundle version strategy (`autoIncrement`), iOS privacy manifest /
      Play data-safety form (easy story: all data local, no tracking), privacy policy
      page (required by both stores even without data collection), store listing text
      and screenshots (light + dark).
- [ ] Beta: TestFlight + Play internal testing round; fix-list from feedback.
- [ ] Submit via `eas submit`; tag the release in git.

Acceptance: installable store builds produced by CI, beta feedback addressed, apps
submitted.

## Suggested order of attack with Claude

Work phase by phase; within a phase, one checkbox (or one bug cluster) per session so
diffs stay reviewable. Good first sessions:

1. "Do the tooling task in Phase 1 of docs/DEVELOPMENT_PLAN.md" (lint, prettier, jest).
2. "Add stable ids to Pair with a persistence migration, then fix the known bugs list."
3. "Extract the usePlayback engine per Phase 2."

Keep this file updated: check items off, note decisions inline (especially the
background-audio spike and the non-goals list), and add discovered work as new
checkboxes rather than doing it silently.
