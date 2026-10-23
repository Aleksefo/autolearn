# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Project conventions

## Plan of record

`docs/DEVELOPMENT_PLAN.md` is the source of truth for scope and sequencing.
Check items off as they land, record decisions inline, and add discovered work
as new checkboxes instead of doing it silently.

## Layout

- `src/app/` — expo-router routes only; keep screens thin.
- `src/components/` — presentational components.
- `src/state/` — Zustand store (`store.ts`), `types.ts`, and `__tests__/`.
- `src/utils/` — small pure helpers.
- Path alias: `@/*` maps to `./src/*` (so `@/state/store`, never `@/src/...`).

## State

- The store (`src/state/store.ts`) owns all persistent data; screens hold view
  state only (ordering, expansion, playback status).
- Pairs are identified by their stable `id` (`newId()` from `src/utils/id.ts`,
  backed by expo-crypto). Never key data operations on list indexes.
- Persistence uses zustand `persist` with `version`/`migrate`. Any change to
  the persisted shape requires bumping `STORAGE_VERSION` and extending
  `migrateState`, plus a migration test.

## Design system

- Tokens live in `src/constants/theme.ts` (palette mirrored from the
  UltimateAchiever app — keep them in sync when that design evolves). Never
  hardcode hex colors in components; read colors via `useTheme()` and pass
  static layout through `StyleSheet` with `Spacing`/`Radii`/`TypeScale`.
- Build UI from `src/components/ui/` (Text, Icon, IconButton, Button, Input,
  SegmentedControl, Switch) before reaching for raw RN primitives. Icons go
  through `ui/Icon` (SF Symbols on iOS, Material on Android) — add new names to
  its map rather than importing icon sets directly.
- Both light and dark must work; the user can override the scheme in Settings
  (`theme` in the store, resolved by `src/hooks/useColorScheme.ts`).
- Haptics: use the wrappers in `src/utils/haptics.ts` on meaningful actions.
- App icon/splash are generated — edit `scripts/generate-icons.mjs` and run
  `node scripts/generate-icons.mjs`; never hand-edit the PNGs.

## Tooling

- Package manager is **bun**; install Expo packages with `npx expo install`.
- Metro runs on port 8095 (`bun start`) — 8081 and 8090 belong to other apps.
- No Expo Go on SDK 57: use the dev build (`expo-dev-client`), locally via
  `npx expo run:android`, or EAS profiles in `eas.json`.
- Before declaring a task done, run and pass: `bun run lint`,
  `bun run typecheck`, `bun run test`, and `bun run format` on changed files.
- Tests: jest with the `jest-expo` preset; native modules are mocked in
  `jest.setup.js`. Store logic must have unit tests.
- Adding a native module (`npx expo install` of anything non-JS) or changing
  icons/splash/app.json requires a dev-client rebuild:
  `npx expo prebuild -p android --clean && npx expo run:android --port 8095 --device`.
