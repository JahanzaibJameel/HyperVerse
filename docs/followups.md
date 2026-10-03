# Followups

Open items deliberately not addressed as part of the SDK 54 dependency
alignment. Grouped by kind. None of these should be started without its own
task and commit.

## Dependency hygiene

**4 pre-existing `expo-doctor` failures.** Unrelated to the alignment and still
present:

- Missing peer dependency for `sentry-expo`.
- Missing peer dependencies for `@storybook/*` packages.
- (`expo-doctor` also reported a duplicate native `expo-file-system`; that one
  **was** resolved by the alignment — see `docs/sdk-54-alignment.md` §Positive
  findings.)

**Remove "declared but never imported" packages.** These were aligned to SDK 54
because they are declared, but `git grep` finds no importer anywhere in tracked
TS/TSX, so the version bump was risk-free precisely because nothing uses them:

- `expo-sqlite` — reached only through WatermelonDB's `SQLiteAdapter`.
- `expo-system-ui`
- `expo-status-bar`
- `expo-web-browser`

Separate cleanup commit: confirm no build-time plugin requirement before
removing any of them.

**`pnpm-workspace.yaml` breaks `expo install`.** The file declares
`packages: ['.']`, which makes pnpm treat the repo root as a workspace and reject
a bare `pnpm add` with `ERR_PNPM_ADDING_TO_ROOT`. `expo install` shells out to
exactly that command and cannot pass `-w`, so **every future `expo install` /
`--fix` will fail** unless worked around:

```
npm_config_ignore_workspace_root_check=true npx expo install --fix
```

Options for a separate commit: remove `pnpm-workspace.yaml` entirely (this repo
is not a monorepo — there is no `packages/` directory), or set
`ignore-workspace-root-check=true` in a committed `.npmrc`.

## Test infrastructure

**WatermelonDB `useIncrementalIndexedDB` deprecation warning.** Emitted twice
per test run from the LokiJS adapter mock (`jest.setup.js:166`). Tried and
reverted: the option is **mandatory**, and omitting it throws at adapter
construction, failing both database suites (184/210). `false` is required to keep
the mock synchronous for Jest. Silencing it means switching to `true`, which
changes persistence semantics and would require re-validating the database
suites — cosmetic warning traded for real regression risk. Not worth doing
unless the noise becomes a problem.

**`jest.setup.js` mocks two `expo-file-system` paths.** Both `'expo-file-system'`
(modern `Directory`/`File` default) and `'expo-file-system/legacy'` (the
imperative API) are mocked after the AI imports migrated. The modern-path mock is
currently attached to no importer. Keep or drop it once the AI module decision
below lands.

**`appLaunchGate.test.tsx` residual flake — post-warmup measurement.** The
warmup added in `957bf37` removed the known mechanism: test 1 dropped from 961ms
to 97ms, matching its siblings at 80–166ms. But the flake is **not confirmed
dead**. Post-fix rate: 1 failure in 12 full-suite runs (1-in-6 in the first
batch, 6/6 in the second). Baseline rate: 1-in-3 on `256183b`. Sample size is
too small to distinguish "fixed" from "reduced".

Next step if it recurs in CI: add a Jest custom reporter that logs the failing
test's name on failure, so the residual failure can be identified rather than
inferred. Do not add this preemptively — wait for CI signal. CI runs on
`ubuntu-latest`, which may or may not reproduce a Windows/Node-25-specific timing
issue.

**Detox is blocked on a testID audit, not on CI wiring.** `__tests__/e2e/` holds
two specs (`auth.e2e.ts`, `userJourneys.e2e.ts`) that no workflow runs, and they
have never been compiled against a real app. Before wiring them into a device
matrix, the premise needs checking rather than assuming: the specs reference
`testID`s that do not exist in `app/`. That premise is **partly wrong** — it
reads as "every referenced testID is missing" but at least
`app/(auth)/unlock.tsx:104` already carries `testID="unlock-retry-button"`. So
the real work is an audit of which selectors are missing versus which already
resolve, not a bulk find-and-replace. Do not start the device matrix before that
audit, and do not add the selectors blind: a `testID` added only to satisfy a
spec is a test-only change to shipping UI. Out of scope for the CI commit
`e87fbac`; this is the next CI-shaped piece of work.

## Data layer

**`AIRepository` ordering is not guaranteed for same-millisecond messages.**
`orderByCreatedThenId()` sorts `created_at` then `id`, and `id` is a WatermelonDB
random string rather than a monotonic counter. When a user message and its reply
land in the same millisecond the rows come back in whatever order those random
strings happen to sort — stable within one result set, meaningless across
machines. This surfaced as a real CI failure on `e8bd322`: the ordering test
passed on Windows and failed on `ubuntu-latest` for no reason related to the code
under test. Fixed in the test by pinning distinct `created_at` values (`e87fbac`),
and the repository comment now says what it actually guarantees.

**The same exposure is still live in the app, not just the test.**
`app/(tabs)/ai.tsx:213-227` writes the user's message and the assistant reply
back to back, so a same-millisecond collision is plausible on a fast device.
`ai.tsx:167` reads them back through `findBySession`, and `ai.tsx:305` renders
`[...aiMessages].reverse()` inside an `inverted` FlatList — so a collision can
invert chat order visibly, not merely return rows in an arbitrary sequence. Not
fixable without a schema change: either a monotonic sequence column, or
client-generated sortable ids. Worth deciding before the assistant is used on
real data, since it is a correctness issue in the feature's headline surface.

**`AIRepository.createMany` now has no caller at all.** It had exactly one — the
ordering test — and that test now calls `create` twice with a clock gap.
`git grep createMany` finds no production importer either. It is dead code, and
deleting it would recover the ~6 statements currently uncovered in
`AIRepository.ts` (100% → 71.42% statements, 85.71% functions). Left in place
deliberately in `e87fbac`: removing it in the same commit as a coverage-floor
change would have conflated two decisions and made the threshold's first
measurement harder to interpret.

## Device verification (all require a physical device or emulator)

None of the following can be automated in this repo; the Jest suite mocks both
`expo-secure-store` and `expo-local-authentication` and proves neither the real
keychain nor the real biometric prompt. The full gesture sequence is in
`docs/sdk-54-alignment.md` § Outstanding manual verification.

**Cold-start auth flow.** Kill the app completely (not just background it) and
relaunch; confirm the biometric prompt appears *before* `(tabs)`. Then clear
AsyncStorage and repeat — the app must land on setup, not tabs. This is the
regression test for the bug fixed in `256183b`.

**Grace-window re-lock.** Background the app for more than 5 minutes, return, and
confirm it re-locks and re-prompts. Under 5 minutes it must stay unlocked. No
test covers the `AppState` listener at all.

**Fail-closed on missing enrolment.** Turn off biometrics in OS settings, then
launch. The app must lock with the "Biometrics unavailable" message rather than
letting the user in.

**Destructive-delete gate.** "Delete all data" in Settings must require
authentication even when app lock is off, and cancelling must leave data intact.

**`expo-file-system` legacy path.** Exercise AI model download and cache
read/write against the new `expo-file-system/legacy` import on real hardware.

**WatermelonDB on SQLite 3.50.3.** `expo-sqlite` 13→16 moved the bundled SQLite
to 3.50.3. Run the schema v1→v2 migration (`ALTER TABLE ... DROP COLUMN`)
against a real database file and confirm no data loss. WatermelonDB 0.27.1 has
never been exercised against this SQLite version in this repo.

**React 19 + React Compiler.** `experiments.reactCompiler` is enabled in
`app.json`. Exercise the app on a mid-range Android device and watch for runtime
warnings the compiler emits. Also worth exercising Storybook, which currently has
unmet React 19 peer dependencies.

## Product / scope

**The AI module is unreachable.** `lib/ai/models/ModelManager.ts` and
`lib/ai/rag/VectorStore.ts` are not imported by any screen or service, so
`ModelManager` never initialises, `activePipeline` stays `null`, and `AIService`
always takes its local-only path. Their imports now correctly target
`expo-file-system/legacy`, but that correctness is currently unobservable at
runtime. Decide: delete the module, or wire it into a screen. Separate commit —
explicitly not part of the dependency alignment.

Also unresolved in that module, for whenever it is revived: `ModelManager`
downloads a relative path (`expo-file-system` requires absolute), fetches
`model_quantized.onnx` without `config.json`/`tokenizer.json` while
`allowRemoteModels = false`, and makes LLM and embedding models mutually
exclusive even though `VectorStore` needs the embedding model active.

## Config

**Dual ESLint config.** Both `.eslintrc.js` (legacy) and `eslint.config.mjs`
(flat) are committed. Under ESLint 9 the flat config wins, so `.eslintrc.js` is
most likely dead code — and it references `@react-native`, which is not installed.
`eslint-config-expo` is now at 10.0.0 (pulled up by `expo install --fix`, which
bundles devDependencies and offers no per-package exclusion) and lint passes with
zero errors and zero warnings, so this is **not urgent**. Still worth deciding:
delete the legacy file and keep flat, or reinstate a working legacy path.