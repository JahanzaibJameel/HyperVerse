---
title: Technical Debt Register
description: Known structural problems in HyperVerse, why they matter, and what fixing them would involve.
status: pre-release
last_verified: 2026-09-29
audience: maintainer
---

# Technical Debt Register

**`pre-release`** · verified `2026-09-29` · ~8 min read

> [!NOTE]
> This file was previously a second copy of the roadmap with aspirational release dates. It is
> now the **technical-debt register**: the structural problems in the codebase, ranked by cost
> of deferral. Feature work is tracked in [ROADMAP.md](ROADMAP.md).

Each entry records the debt, why it matters, and the shape of the fix. Nothing here has an
assigned date.

## Contents

1. [Blocking](#1-blocking)
2. [Correctness](#2-correctness)
3. [Duplication and drift](#3-duplication-and-drift)
4. [Testing](#4-testing)
5. [Tooling](#5-tooling)
6. [Dead weight](#6-dead-weight)

---

## 1. Blocking

> [!NOTE]
> Items 1.1, 1.2, and 1.3 are **resolved**. Screens now read and write through
> `lib/database/repositories`, the schema is at version 2 with a `migrations` array, and
> onboarding creates a `users` row whose id is stored as `user.dbId`. They are kept below for
> history. The genuinely open blocking item is 1.4.

### 1.1 The database is unreachable from the UI — RESOLVED

**Debt.** `lib/database` is a complete, tested layer that no file under `app/` imports. The
data model and the screens have drifted apart: the schema has `health_metrics`,
`transactions`, and `habit_entries`, while the screens read flat objects out of
`lib/stores/dataStore.ts`.

**Resolution.** Eight repositories in `lib/database/repositories/` now sit between the screens
and the database. `dataStore.ts` was deleted. Every tab screen loads through its repository and
reloads on focus.

### 1.2 No migrations — RESOLVED

**Debt.** The schema is version 1 and `lib/database/migrations/` was removed because those
files called an API that does not exist in WatermelonDB 0.27.

**Resolution.** `lib/database/schema.ts` is version 2 and exports a `migrations` array using
only step types WatermelonDB 0.27 supports (`create_table`, `add_columns`, `sql`). The array is
passed to `SQLiteAdapter`.

> [!WARNING]
> The v1→v2 upgrade path is **untested**. Tests build a fresh schema with the LokiJS adapter,
> so `ALTER TABLE "notes" DROP COLUMN "is_encrypted";` has never executed against a real
> SQLite file. See §4.2.

### 1.3 No `users` row is ever created — RESOLVED

**Debt.** `app/(auth)/setup.tsx` called `AuthService.createInitialProfile`, which wrote a
profile to SecureStore. Nothing inserted into `users`, the table every other table references
via `user_id`.

**Resolution.** Onboarding upserts a `users` row and stores its id as `user.dbId`, which every
screen uses to scope its queries.

## 2. Correctness

### 2.1 `notes.is_encrypted` is not implemented — RESOLVED BY REMOVAL

**Debt.** The `notes` table had `is_private` and `is_encrypted` columns. No code encrypted
anything; a note marked encrypted was plaintext SQLite.

**Resolution.** The column was dropped in schema v2 rather than left in place implying a
privacy guarantee the code does not provide. `is_private` remains, and is a UI hint rather than
an access control.

**Fix shape.** Either implement column-level encryption with a key held in SecureStore, or
drop the columns. Do not ship the flag without the guarantee.

### 2.2 React Query is mounted but unused — RESOLVED

**Debt.** `@tanstack/react-query` was a dependency and `QueryClientProvider` wrapped the app in
`app/_layout.tsx`, but no query hooks existed. It was also the wrong tool for purely local data.

**Resolution.** The provider and both packages were removed. Repositories plus a
`useFocusEffect` reload pattern serve the same purpose without a second caching layer to keep
coherent with the database.

### 2.3 `addXP` is untested against the real model

**Debt.** The multi-level-up loop in `User.addXP` is covered by a test that runs against a
hand-written `MockUser`, not the real WatermelonDB model. The smoke test covers a single
level-up only.

**Fix shape.** Add smoke-test cases for multi-level awards and for the `xpToNextLevel` growth
factor, against the real model.

## 3. Duplication and drift

### 3.1 Two `UserProfile` types — resolved

`context/AppContext.tsx` and `lib/services/AuthService.ts` each declared a `UserProfile` with
different fields. `context/` was imported by nothing except `XPBar`, which read a fabricated
seed from it rather than real state. `context/` is deleted and
`lib/services/AuthService.ts` is now the single `UserProfile` definition.

### 3.2 Two tab layouts, one used

`app/(tabs)/_layout.tsx` defines `NativeTabLayout` and `ClassicTabLayout`. Only one is mounted;
the other must still typecheck and lint. Delete the unused one, or make the choice a setting.

### 3.3 Accent palettes duplicated per screen

`app/(tabs)/_layout.tsx` and `app/(tabs)/tasks.tsx` each define a local `getAccentColor` with
the same five-entry palette. These are exactly the variables that previously collided with
`useColors()`'s `colors` and produced lint errors. Move to one exported map in `constants/`.

### 3.4 Storybook is wired up — RESOLVED

`.storybook/main.ts`, `.storybook/preview.tsx`, `.storybook/index.tsx`, and
`.storybook/stories/` exist, and `npm run storybook` starts Storybook on port 8082. The
`metro.config.js` generation hook produces `storybook.requires.ts` on every Metro run.

**Limitation.** It is not in CI and there is no visual regression check, so stories are only
verified by running Storybook locally. They are still typechecked and linted.

### 3.5 Component-level bugs found by writing stories

Rendering every component in a real tree is a cheap way to catch issues unit tests miss. Three
surfaced while writing the stories in `.storybook/stories/`:

- **`MiniBarChart` hard-codes SVG gradient IDs** (`barGradActive`, `barGradInactive`). Two
  charts on one screen share an ID, so the second chart's stops override the first's. Needs an
  ID derived from a counter or a prop.
- **`CircularProgress` derives its gradient ID from `label`** (`grad_<label>`). Two progress
  rings with the same label collide the same way.
- **`SkeletonLoader` mixes `useNativeDriver` settings** inside one animation. The first timing
  uses `Platform.OS !== "web"`, the second hard-codes `true`, so on web the first leg runs on
  the JS thread and the shimmer stutters.

None of these break normal use, which is why the test suite did not catch them. See
[docs/STORYBOOK.md §6](docs/STORYBOOK.md#6-what-these-stories-revealed).

## 4. Testing

### 4.1 37.4% statement coverage

Measured over `lib/`, `components/`, and `hooks/`. `app/` is still excluded from the
`collectCoverageFrom` globs, so the true figure is lower.

| Area | Statements |
| :-- | --: |
| `hooks` | 100.00% |
| `lib/database/repositories` | 84.54% |
| `lib/ai/insights` | 81.51% |
| `lib/services` | 56.95% |
| `lib/database` | 46.55% |
| `lib/database/models` | 29.62% |
| `components` | 12.37% |
| `lib/stores` | 8.33% |
| `lib/ai/models`, `lib/ai/rag`, `components/ui` | 0.00% |

Up from 13.88%. **Fix shape.** Add `app/` to the coverage globs so the number is honest, then
raise the lowest areas first. `lib/ai/models` and `lib/ai/rag` are the clearest gap, but both
wrap `@xenova/transformers` and need a device test rather than a mock.

### 4.2 Migrations have never run against real SQLite

`lib/database/schema.ts` is at version 2, but tests build a fresh schema through the LokiJS
adapter, so the v1→v2 upgrade SQL has never executed against a real SQLite file.

**Fix shape.** Seed a version-1 database on device or in an integration environment, then open
it with the version-2 adapter and assert the upgrade succeeds.

### 4.3 E2E specs have never run

`__tests__/e2e/auth.e2e.ts` and `userJourneys.e2e.ts` are excluded from Jest and no workflow
invokes Detox. They have never been validated against a running app.

**Fix shape.** Get one Detox spec running on a CI emulator, then the second.

### 4.3 Model tests run against mocks, not models

`__tests__/unit/database/models/{User,Task}.test.ts` define `MockUser` and `MockTask` — plain
classes that duplicate production logic. They can pass while the real model is broken, which is
how a bug affecting all twelve models went unnoticed.

**Fix shape.** Keep the mocks only for cases needing a non-persisted instance; move
behavioural assertions onto the real models via the smoke test.

## 5. Tooling

### 5.1 `lint` mutates the working tree — RESOLVED

The script was `eslint . --ext .ts,.tsx --fix`, with no check-only variant, so CI could not run
lint without risking a write.

**Resolution.** `lint` is now check-only and `lint:fix` applies fixes. CI runs `lint`, and it
currently reports 0 errors and 0 warnings.

### 5.2 `pnpm dev` is Replit-only — RESOLVED

The script interpolated `$REPLIT_DEV_DOMAIN`, `$REPL_ID`, and `$PORT` using POSIX inline
assignment, which PowerShell does not interpret.

**Resolution.** `dev` is now `expo start --localhost`; the Replit wiring lives in `dev:replit`.

### 5.3 Build script has a fragile health check

`checkMetroHealth()` in `scripts/build.js` returned a false positive when a dying Metro process
still held port 8081. The build then skipped starting Metro and failed with `fetch failed` — a
confusing failure for a transient cause. Verify the `/status` payload rather than only the HTTP
status, and retry the bundle download once before failing.

## 6. Dead weight

Most of this list has been removed. What remains is noted as such.

| Item | Note |
| :-- | :-- |
| `.eslintrc.js` | Superseded by `eslint.config.mjs`; not deleted |
| `proguard-rules.pro` | Never copied into a build; no `android/` is committed |
| `sentry-expo` | `require`d in `lib/logger.ts` behind a try/catch, never configured. Kept deliberately: activating it is one env var away and it is the only error-reporting path |
| `@xenova/transformers` | Imported by `ModelManager`, and `AIService` now calls into it. The model path still needs files that do not ship |
| ~~`react-native-localize`, `react-i18next`~~ | **Removed** — no imports, no translation files |
| ~~`victory-native`~~ | **Removed** — no chart imported it |
| ~~`tamagui`~~ | **Removed** — no component imported it |
| ~~`react-native-keychain`~~ | **Removed** — `expo-secure-store` is used instead |
| ~~`zod`, `zod-validation-error`~~ | **Removed** — no form validation existed |
| ~~`react-hook-form`~~ | **Removed** |
| ~~`@tanstack/react-query`~~ | **Removed** — no query hooks existed; see §2.2 |
| ~~`date-fns`, `expo-av`, `expo-image-picker`, `expo-location`, `@react-native-community/netinfo`~~ | **Removed** — zero imports |
| ~~`@storybook/*`, 7 stories~~ | **Removed**; see §3.4 |
| ~~`.env.example` RPC and OpenAI keys~~ | **Cleaned**; see `.env.example` |

---

**Status** `pre-release` · **verified** `2026-09-29` · [README](README.md) ·
[Roadmap](ROADMAP.md) · [Architecture](ARCHITECTURE.md) ·
[Security](SECURITY.md)

[Edit this page](https://github.com/JahanzaibJameel/HyperVerse/blob/main/ROADMAP_V2.md) ·
[Open an issue](https://github.com/JahanzaibJameel/HyperVerse/issues/new)
