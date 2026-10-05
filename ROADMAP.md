---
title: Roadmap
description: What is planned for HyperVerse, ordered by the gap between what is built and what is intended.
status: pre-release
last_verified: 2026-09-29
audience: all
---

# Roadmap

**`pre-release`** · verified `2026-09-29` · ~4 min read

> [!WARNING]
> **Partly superseded.** `ROADMAP_V2.md` and `docs/followups.md` are the actively
> maintained records; where they disagree with this file, prefer those. Coverage figures here
> were refreshed 2026-10-05, but item status was last audited 2026-09-29.

Ordered by how much each item blocks real use, not by date. No dates are attached because none
are committed to.

> [!IMPORTANT]
> Stages 0, 1, and 2 are complete. The app now persists real data in SQLite, CI enforces
> typecheck and lint, and lint is clean at 0 errors and 0 warnings. Measured coverage is 40.52%
> of statements. Stage 3 is partially done: the AI answers grounded questions through a local
> engine, but no on-device model files ship with the app.

For the longer-horizon technical-debt view, see [ROADMAP_V2.md](ROADMAP_V2.md).

## Contents

1. [Stage 0 — Make it honest](#stage-0--make-it-honest) ✅
2. [Stage 1 — Persist real data](#stage-1--persist-real-data) ✅
3. [Stage 2 — Finish the feature set](#stage-2--finish-the-feature-set) ✅
4. [Stage 3 — Make the AI run](#stage-3--make-the-ai-run)
5. [Stage 4 — Ship](#stage-4--ship)
6. [Explicitly not planned](#explicitly-not-planned)

---

## Stage 0 — Make it honest ✅

Prerequisites for trusting any measurement. **Complete.**

- [x] Add `typecheck` and check-only `lint` to `test.yml` so CI enforces them, not just Jest
- [x] Fix the lint warnings — now 0 errors and 0 warnings, including `react-hooks/exhaustive-deps`
- [x] Delete the `storybook` scripts, config, workflow, and 7 unreachable stories rather than
      leave scripts that only print a message
- [x] Re-add Storybook properly: config, `metro.config.js` generation hook, entry point, and
      real stories for the components that have them. `npm run storybook` starts it on port
      8082. See [docs/STORYBOOK.md](docs/STORYBOOK.md).
- [x] Move `react-native-bundle-visualizer` from `dependencies` to `devDependencies`
- [x] Make `lint` check-only and add `lint:fix`
- [x] Add `dev` for local use and keep `dev:replit` explicitly Replit-only
- [x] Re-enable linting on test files, which were silently excluded, and fix the 4 errors that
      surfaced
- [x] Add an advisory `pnpm audit` job to CI
- [x] Remove ~15 dependencies with zero imports, including `@tanstack/react-query` and its
      root provider

## Stage 1 — Persist real data ✅

**This was the blocking work. Complete.**

- [x] Connect `app/(tabs)/tasks.tsx` to `lib/database` and delete `mockTasks`
- [x] Replace `dataStore` health/finance demo state with real `health_metrics`, `transactions`,
      and `financial_goals` queries
- [x] Persist `ai_messages` for chat history through `AIRepository`
- [x] Add database migrations — schema is now version 2 with a `migrations` array passed to
      `SQLiteAdapter`
- [x] Define a `User` record lifecycle — onboarding now creates a `users` row and stores its
      ID as `user.dbId`
- [x] Decide about AsyncStorage — the `dataStore` was deleted; AsyncStorage now holds only UI
      preferences
- [x] Implement `deleteUserCascade` so account deletion actually removes all dependent rows

## Stage 2 — Finish the feature set ✅

- [x] Implement `app/(tabs)/habits.tsx` against the `habits` and `habit_entries` tables
- [x] Implement `app/(tabs)/settings.tsx` against the `settings` table
- [x] Remove the `ar`, `blockchain`, `iot`, and `social` tabs; four tabs that reset on every
      reload were worse than four that do not exist
- [x] Drop `notes.is_encrypted` in schema v2 rather than leave a column implying an encryption
      guarantee that does not exist
- [x] Wire `app/tasks/new.tsx` and `app/tasks/[id].tsx` to the database

## Stage 3 — Make the AI run

**Partially complete.** The assistant works, but not the way the architecture originally
intended.

Done:

- [x] Call `AIService` from `app/(tabs)/ai.tsx`, replacing the canned `AI_RESPONSES`
- [x] Build a snapshot from the user's real records (`snapshotBuilder`) and answer from it
      (`InsightEngine`) when no model is active
- [x] Report the backend used, so the UI and tests can tell `'local'` from `'model'`
- [x] Add 26 tests for the insight engine

Open:

- [ ] Choose and vendor a model, or define a download flow. `ModelManager` needs files at
      `model.localPath`; `assets/ai-models/` does not exist, so the model path has never run on
      a device
- [ ] Decide on real embeddings. `VectorStore` computes cosine similarity over JSON, but
      nothing currently generates the embeddings it stores
- [ ] Test `lib/ai/models` and `lib/ai/rag`, both at 0% — they wrap `@xenova/transformers`,
      which needs a native module Jest cannot load
- [ ] Size models against the ~5 MB JS bundle budget, or move them to a post-install download
- [ ] Make the local engine's limits visible in the UI, so users do not mistake templated
      answers for a language model

## Stage 4 — Ship

- [x] Raise coverage above 37.4% — now 40.52% (floors 38/34/33/38). `lib/ai/models`, `lib/ai/rag`, `components/ui`, and
      `lib/stores` are at or near 0%, and `app/` is excluded from the coverage globs entirely
- [ ] Test the v1→v2 migration against a real SQLite file. Tests use the LokiJS adapter, which
      builds a fresh schema, so the `DROP COLUMN` SQL has never executed
- [ ] Get the two Detox specs running on an emulator; they have never been executed
- [ ] Decide on a privacy posture and write it down; see [SECURITY.md](SECURITY.md)
- [ ] Establish whether `notes` and AI chat history should be encrypted at rest
- [ ] Decide whether to keep `sentry-expo`; if kept, document the telemetry it introduces
- [ ] Verify on physical devices, not only in the simulator
- [ ] Produce store-ready builds; currently only a static Expo Go build exists

## Explicitly not planned

Recorded here so they are not quietly reintroduced. The previous roadmap contained all of
these; none had supporting code, and the project has no backend, no accounts, and no server.

- Cloud sync, multi-device sync, and conflict resolution
- Microservices, Kubernetes, edge computing, and any server-side infrastructure
- A public API and third-party integrations
- A desktop client, A/B testing framework, or OTA update infrastructure
- Blockchain for data storage, "quantum-ready" encryption, and web3
- Research papers, hackathons, bug bounties, and compliance certifications
- User-count and retention targets

---

**Status** `pre-release` · **verified** `2026-09-29` · [README](README.md) ·
[Technical debt](ROADMAP_V2.md) · [Contributing](CONTRIBUTING.md)

[Edit this page](https://github.com/JahanzaibJameel/HyperVerse/blob/main/ROADMAP.md) ·
[Open an issue](https://github.com/JahanzaibJameel/HyperVerse/issues/new)
