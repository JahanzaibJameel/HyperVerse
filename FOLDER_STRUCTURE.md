---
title: File Inventory
description: Every source file in HyperVerse with its purpose and implementation state.
status: pre-release
last_verified: 2026-09-29
audience: contributor
---

# File Inventory

**`pre-release`** · verified `2026-09-29` · ~7 min read

A file-by-file reference. For the directory-level view, see
[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md).

**State legend** — `Real` implemented and does what the name suggests · `Demo` renders but is
backed by hardcoded or component-local data · `Stub` placeholder · `Unused` not imported
anywhere.

## Contents

1. [Configuration](#1-configuration)
2. [Routes](#2-routes)
3. [lib/](#3-lib)
4. [components/](#4-components)
5. [Hooks, constants, context](#5-hooks-constants-context)
6. [Tests](#6-tests)
7. [Tooling](#7-tooling)

---

## 1. Configuration

| File | Purpose | State |
| :-- | :-- | :-- |
| `package.json` | Dependencies and scripts. `packageManager: pnpm@9.15.0`; pnpm override pins `@babel/runtime` to `^7.29.2`. | Real |
| `tsconfig.json` | Extends `expo/tsconfig.base`. Adds `moduleResolution: bundler`, `experimentalDecorators`, `useDefineForClassFields: false` (required by WatermelonDB decorators). | Real |
| `app.json` | Expo config. `newArchEnabled: true`, typed routes, React Compiler. Plugins: `expo-router` (origin `https://replit.com/`) and `expo-font`. **No Sentry, no SSL pinning plugin.** | Real |
| `babel.config.js` | `babel-preset-expo` plus the React Compiler plugin. | Real |
| `metro.config.js` | `@react-native/metro-config` with a Terser config; `inline: 2` nested under `compress`. | Real |
| `jest.config.js` | `jest-expo` preset, `@/` alias, pnpm-aware `transformIgnorePatterns`, excludes Detox specs, `.kilo/worktrees`, `static-build`. | Real |
| `jest.setup.js` | Native-module mocks, including the LokiJS swap for the SQLite adapter. | Real |
| `eslint.config.mjs` | Flat config. Ignores `**/*.js`, `.kilo/worktrees`, `static-build`, `.expo`, and the auto-generated `storybook.requires.ts`. Test files **are** linted. | Real |
| `expo-env.d.ts` | Expo-generated types reference. | Real |
| `.env.example` | Template for `EXPO_PUBLIC_*` variables. | Real |
| `llms.txt` | Machine-readable doc index for AI agents. | Real |
| `proguard-rules.pro` | R8 rules for a future native build. **Inert** — must be copied into a generated `android/app/`. | Unused |
| `.eslintrc.js` | Legacy config, superseded by `eslint.config.mjs`. | Unused |

> [!NOTE]
> `.env.example` lists `EXPO_PUBLIC_OPENAI_API_KEY`, `EXPO_PUBLIC_ETHEREUM_RPC_URL`, and
> similar variables. **None are read by the code.** The app makes no network requests. Only
> `EXPO_PUBLIC_SENTRY_DSN` and the Expo/Replit domain variables have any effect.

## 2. Routes

| File | Lines | Purpose | State |
| :-- | --: | :-- | :-- |
| `app/_layout.tsx` | 107 | Providers, Inter font, splash, `QueryClientProvider` | Real |
| `app/+not-found.tsx` | 40 | 404 screen | Real |
| `app/(auth)/_layout.tsx` | 20 | Auth group layout | Real |
| `app/(auth)/setup.tsx` | 134 | Onboarding; calls `AuthService.createInitialProfile` | Real |
| `app/(tabs)/_layout.tsx` | 175 | `NativeTabLayout`, `ClassicTabLayout`, auth redirect | Real |
| `app/(tabs)/index.tsx` | Dashboard; cross-domain insights from repositories | Real |
| `app/(tabs)/tasks.tsx` | Tasks via `TaskRepository` | Real |
| `app/(tabs)/habits.tsx` | Habits via `HabitRepository` | Real |
| `app/(tabs)/health.tsx` | Health metrics via `HealthRepository` | Real |
| `app/(tabs)/finance.tsx` | Finance via `FinanceRepository` | Real |
| `app/(tabs)/ai.tsx` | Chat UI over `AIRepository` + `AIService` | Real |
| `app/(tabs)/settings.tsx` | Settings via `SettingsRepository` | Real |
| `app/tasks/new.tsx` | Task creation form via `TaskRepository` | Real |
| `app/tasks/[id].tsx` | Task detail via `TaskRepository` | Real |

> [!NOTE]
> The `ar`, `blockchain`, `iot`, and `social` tab screens have been deleted. They reset on
> every reload and had no data behind them, which made the tab bar look more functional than
> the app was.

## 3. lib/

### Database

| File | Lines | Purpose | State |
| :-- | --: | :-- | :-- |
| `schema.ts` | 183 | 12 tables, version 1 | Real |
| `database.ts` | 97 | `SQLiteAdapter` (`jsi: true`), `Database` singleton, readiness helpers, typed `database.get<T>()` | Real |
| `index.ts` | 8 | Barrel | Real |
| `models/User.ts` | 92 | `addXP` (multi-level loop), `updateStreak` | Real |
| `models/Task.ts` | 77 | `complete`, `updateStatus`, `updatePriority`, `addTag`, `removeTag`, `parsedTags`, `isOverdue` | Real |
| `models/Habit.ts` | 69 | Streak logic, `habitEntries` relation | Real |
| `models/HabitEntry.ts` | 29 | Entry record | Real |
| `models/HealthMetric.ts` | 59 | Daily metrics | Real |
| `models/Transaction.ts` | 66 | Finance records | Real |
| `models/FinancialGoal.ts` | 59 | Savings goals | Real |
| `models/Note.ts` | 65 | Notes; has `is_encrypted` column with **no encryption implemented** | Partial |
| `models/Event.ts` | 85 | Calendar events | Real |
| `models/AIMessage.ts` | 60 | Chat history | Real |
| `models/Achievement.ts` | 55 | Unlocks | Real |
| `models/Setting.ts` | 74 | Key/value config | Real |
| `models/index.ts` | 12 | Barrel | Real |

### Services, stores, AI

| File | Lines | Purpose | State |
| :-- | --: | :-- | :-- |
| `services/AuthService.ts` | 328 | Singleton. Device ID (crypto digest), SecureStore profile, biometric auth, app lock, `updateProfile`, `deleteProfile` (cascades to SQLite), `exportUserData` | Real |
| `services/BaseService.ts` | 66 | Base class | Real |
| `services/index.ts` | 9 | Barrel | Real |
| `logger.ts` | 250 | Singleton. Central `redact()` for secret-safe logging | Real, tested |
| `stores/authStore.ts` | 108 | `user`, `isAuthenticated`, `isLoading`, actions | Real |
| `stores/themeStore.ts` | 55 | `themeMode`, `accentColor` | Real |
| `stores/index.ts` | 10 | Barrel | Real |
| `ai/AIService.ts` | 334 | `sendMessage`, model/local routing, context retrieval | Real, **called by `ai.tsx`** |
| `ai/insights/InsightEngine.ts` | 300 | Deterministic grounded answers from a user snapshot | Real, 81% covered |
| `ai/insights/snapshotBuilder.ts` | 115 | Builds the snapshot from real repository data | Real, 81% covered |
| `ai/models/ModelManager.ts` | 315 | `@xenova/transformers` pipeline lifecycle, model catalogue | Real code, **no models present** |
| `ai/rag/VectorStore.ts` | 268 | JSON embeddings via `expo-file-system`, cosine similarity | Real code, 0% covered |
| `ai/index.ts` | 6 | Barrel | Real |
| `storage.ts` | 62 | `safeGetItem` / `safeSetItem` / `safeDeleteItem` | Real |
| `logger.ts` | 141 | Levelled logger; `sentry-expo` behind a DSN check | Real, inert by default |
| `constants.ts` | 206 | App-wide constants | Real |
| `index.ts` | 11 | Barrel | Real |

## 4. components/

| File | Purpose | State |
| :-- | :-- | :-- |
| `GlowCard.tsx` | Neon card; `onPress` + optional children | Real |
| `NeonButton.tsx` | Primary CTA | Real |
| `ShaderBackground.tsx` | Gradient + Reanimated background | Real |
| `XPBar.tsx` | XP progress bar | Real |
| `CircularProgress.tsx` | Progress ring | Real |
| `MiniBarChart.tsx` | Small bar chart | Real |
| `ErrorBoundary.tsx` | Top-level error boundary | Real |
| `ErrorFallback.tsx` | Fallback UI | Real |
| `ErrorState.tsx` | Inline error state | Real |
| `GradientCard.tsx` | Gradient surface | Real |
| `StatBar.tsx` | Statistic row | Real |
| `SkeletonLoader.tsx` | Loading placeholder | Real |
| `IoTDevice.tsx` | IoT device widget | Real |
| `NFTCard.tsx` | NFT card | Real |
| `NotificationBadge.tsx` | Badge | Real |
| `LiveTicker.tsx` | Ticker | Real |
| `KeyboardAwareScrollViewCompat.tsx` | Keyboard shim | Real |
| `LazyScreen.tsx` | Lazy-loading wrapper | Real |

## 5. Hooks, constants, context

| File | Purpose | State |
| :-- | :-- | :-- |
| `hooks/useColors.ts` | 12 lines. Returns the light or dark palette | Real, 100% covered |
| `constants/colors.ts` | Light and dark palettes, `radius` | Real |
| `context/AppContext.tsx` | Legacy provider declaring a second, incompatible `UserProfile` type | Unused |

> [!WARNING]
> `context/AppContext.tsx` and `lib/services/AuthService.ts` both define `UserProfile` with
> different shapes. Consolidate on the `AuthService` one and delete `context/` before adding
> more surfaces.

## 6. Tests

| File | Covers |
| :-- | :-- |
| `__tests__/database/smoke.test.ts` | Real WatermelonDB CRUD, relations, XP, task completion against the LokiJS adapter |
| `__tests__/integration/authFlow.test.tsx` | Real `AuthService` + auth store + biometric flows |
| `__tests__/unit/services/AuthService.test.ts` | Device ID, profile CRUD, biometrics, export |
| `__tests__/unit/database/models/User.test.ts` | `addXP`, streaks, field mapping |
| `__tests__/unit/database/models/Task.test.ts` | `complete`, status, priority, tags |
| `__tests__/unit/hooks/useColors.test.ts` | Palette selection per colour scheme |
| `__tests__/components/GlowCard.test.tsx` | Rendering, press handling, mixed children |
| `__tests__/components/NeonButton.test.tsx` | Press and disabled states |
| `__tests__/unit/example.test.ts` | Scaffold test |
| `__tests__/e2e/auth.e2e.ts` | Detox. **Excluded from Jest, not run in CI.** |
| `__tests__/e2e/userJourneys.e2e.ts` | Detox. **Excluded from Jest, not run in CI.** |

> [!WARNING]
> The two model test files define `MockUser` and `MockTask` — plain classes, not WatermelonDB
> models. They duplicate production logic, so they can pass while the real model is broken.
> Prefer adding cases to `__tests__/database/smoke.test.ts`. See
> [ROADMAP_V2 §4.3](ROADMAP_V2.md#43-model-tests-run-against-mocks-not-models).

## 7. Tooling

| File | Purpose | State |
| :-- | :-- | :-- |
| `scripts/build.js` | Static Expo Go build | Real |
| `server/serve.js` | Static server for `static-build/` | Real |
| `.github/workflows/test.yml` | `pnpm install` + `typecheck` + `lint` + `test` + `coverage`, plus an advisory `pnpm audit` job | Real |
| `.github/workflows/build.yml` | Web export + static build | Real |
| `.github/workflows/release.yml` | Tag-triggered release | Real |
| `.github/dependabot.yml` | Dependency updates | Real |
| `.github/ISSUE_TEMPLATE/` | `bug_report.md`, `feature_request.md`, `question.md` | Real |
| `.github/pull_request_template.md` | PR template | Real |

---

**Status** `pre-release` · **verified** `2026-09-29` · [README](README.md) ·
[Directory map](PROJECT_STRUCTURE.md) · [Testing](docs/TESTING.md) ·
[Contributing](CONTRIBUTING.md)

[Edit this page](https://github.com/JahanzaibJameel/HyperVerse/blob/main/FOLDER_STRUCTURE.md) ·
[Open an issue](https://github.com/JahanzaibJameel/HyperVerse/issues/new)
