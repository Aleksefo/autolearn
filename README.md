# Autolearn

Learn languages passively. Build a list of term/definition pairs and listen to
them as spoken audio — the term in the source language, the definition in the
target language — while you go about your day.

## Tech

- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) / React Native 0.86 /
  React 19, New Architecture
- TypeScript (strict)
- [expo-router](https://docs.expo.dev/versions/v57.0.0/sdk/router/) for navigation
- [expo-speech](https://docs.expo.dev/versions/v57.0.0/sdk/speech/) for text-to-speech
- [Zustand 5](https://zustand.docs.pmnd.rs/) persisted to AsyncStorage
- Icons via `@expo/vector-icons`

## Development

```bash
bun install
bun start          # Metro on port 8095 (8081/8090 are used by other apps)
```

SDK 57 has no Expo Go — use a development build (`expo-dev-client` is
installed). Build locally with `npx expo run:android` / `run:ios`, or in the
cloud with `npx eas-cli build -p android --profile development` (profiles live
in `eas.json`).

Checks:

```bash
bun run lint        # expo lint (ESLint + prettier)
bun run typecheck   # tsc --noEmit
bun run test        # jest (jest-expo preset)
bun run format      # prettier --write .
```

## Structure

- `src/app/` — expo-router routes
- `src/components/` — UI components
- `src/state/` — Zustand store (`store.ts`), types, tests
- `src/utils/` — small helpers
- `docs/DEVELOPMENT_PLAN.md` — the roadmap to v1.0; source of truth for what's
  next

## Roadmap

See [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md).
