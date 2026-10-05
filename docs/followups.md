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

**Audit job is `continue-on-error`.** RESOLVED at `d9b76f0`.
`.github/workflows/test.yml` used to run `pnpm audit --audit-level=high` with
`continue-on-error: true`, so the job could never fail the pipeline and a green
tick meant only that the job had run. Three changes closed that:

- The audit step runs **table mode**, not `--json`. `pnpm audit --json` in 9.15.0
  does not apply `auditConfig.ignoreGhsas`, so the ignore list had no effect on
  the exit code; table mode honours it.
- `continue-on-error: true` was **removed**, so the job gates for real.
- The summary step now fires **only on failure**. A clean audit emits no
  annotation; the accepted-advisory tally lives on the run page as the `Severity:`
  line in the step log.

Proven real, not vacuous: removing one GHSA from the ignore list flips the exit
code to 1, which is what makes the gate worth having.

Measured 2026-10-03 on `pnpm-lock.yaml` (pnpm 9.15.0), reproducing CI exactly:

```
96 vulnerabilities found
Severity: 4 low | 33 moderate | 56 high | 3 critical
```

All three criticals are transitive and none is reachable from app code, but that
is a judgement that still has to be made per advisory rather than assumed:

| Advisory | Package | Vulnerable | Patched | Reached via |
| --- | --- | --- | --- | --- |
| GHSA-xq3m-2v4x-88gg | `protobufjs` | `<7.5.5` | `>=7.5.5` | `@xenova/transformers` → `onnxruntime-web` → `onnx-proto` |
| GHSA-w7jw-789q-3m8p | `shell-quote` | `>=1.1.0 <=1.8.3` | `>=1.8.4` | `react-devtools-core` (1408 paths) |
| GHSA-vfj7-8cjw-p6xm | `tar` | `<=7.5.18` | `>=7.5.19` | `@expo/cli` |

Representative highs: `sharp` `<0.35.4` (via `@xenova/transformers`),
`undici` `<6.28.1` and `js-yaml` (both via `@expo/cli`), `image-size` `<=2.0.2`
(via `metro`), `node-forge` `<=1.4.0` (via `@expo/code-signing-certificates`,
**no patched version exists**), `http-cache-semantics` (via `@expo/ngrok`, no
patched version), and `brace-expansion` / `braces` stack-exhaustion advisories
reaching 17k–22k paths through `glob`/`minimatch`.

Note the two advisories with no available patch: those cannot be "fixed" by a
version bump and force an accept-or-remove decision.

To close: for each advisory choose fix (bump, possibly a major), upgrade
(replace the package), or accept (document the reasoning in an allowlist here).
Only then remove `continue-on-error` and let the job gate on whatever remains.
Doing it in the other order converts one dishonest green into a dishonest red.

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

## CI / GitHub

**Branch protection — audit job display name changed.**
`.github/workflows/test.yml` renamed the audit job's display name to
`audit (advisory)`. The job id is unchanged. If branch protection requires
`Test Suite / audit` as a status check, that string will need updating to
`Test Suite / audit (advisory)`. Verify under Settings → Branches → Require
status checks.

Unverified as of 2026-10-03: branch protection requires authentication, so it
could not be read from the repo. If the check was left pointing at the old
string, every push will report the required check as missing and block merges
rather than failing loudly — which would look like a broken pipeline rather than
a stale setting. Cheap to confirm, so confirm it before relying on a green
sidebar again.

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

> **CORRECTION (2026-10-03) — the reachability claim above is wrong; the
> runtime claim is right.** `lib/ai/` *is* reachable from shipped code:
> `app/(tabs)/ai.tsx` imports `lib/ai/AIService.ts`, which imports
> `ModelManager` at `lib/ai/AIService.ts:1` and `VectorStore` at `:2`, and
> `ModelManager` imports `@xenova/transformers` at
> `lib/ai/models/ModelManager.ts:4`. So these files are statically bundled, not
> orphaned — "not imported by any screen or service" does not hold.
>
> What *is* accurate: `ModelManager.initialize()` is never called, so
> `activePipeline` stays `null` and `AIService` does take its local-only path.
> The code ships but never executes.
>
> This matters for security triage, not just tidiness: `@xenova/transformers`
> is a production dependency and drags 8 critical/high advisories
> (`protobufjs` ×6, `sharp` ×2) into the shipped bundle in a dormant state.
> Dormant is not the same as absent, and the fix is now security work rather
> than optional cleanup. See "Dependency advisory triage". The original text is
> left in place above so the correction is visible against what it replaces.

> **CORRECTION 2 (2026-10-03) — the correction above is itself wrong. Bundle
> measurement supersedes it.** Measured with `npx expo export --platform ios
> --dump-sourcemap` and reading the export sourcemap's `sources` array:
> `@xenova/transformers` **is** bundled — 16 source modules
> (`transformers.js`, `pipelines.js`, `backends/onnx.js`, `utils/image.js` and
> others), alongside `onnxruntime-web`, `onnxruntime-common` and
> `@huggingface/jinja`. **But `protobufjs`, `onnx-proto` and `sharp` are all
> absent from both the iOS and Android bundles.** `@xenova/transformers` resolves
> those lazily at inference time rather than through static imports, so Metro
> never pulls them in.
>
> So of the 8 advisories attributed to that dependency — including the tree's
> only critical, `GHSA-xq3m-2v4x-88gg` — **0 of 8 are in the shipped bundle.**
> The earlier claim that they are "shipped-but-dormant" overstated it: the
> wrapper ships, the vulnerable parsers and decoders do not.
>
> The first correction was right about one thing and that still stands:
> `lib/ai/` *is* reachable from `app/(tabs)/ai.tsx` and is bundled. It is the
> severity of the consequence that was wrong, not the reachability. The finding
> remains worth acting on — the dependency is unused, large, and its vulnerable
> code arrives the moment anyone calls `ModelManager.initialize()` — but it is a
> supply-chain and bundle-size problem, not a live exposure today. `nanoid` is
> the only measured live exposure in the gated set. Full measurements, including
> the method's limits, are under "Bundle reachability (measured)".

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
## Dependency advisory triage

Measured 2026-10-03 with `pnpm audit --audit-level=high --json` (pnpm 9.15.0),
which reports **96 line-items** but only **93 unique advisories** across all
severities, and **59 line-items / 44 unique GHSA IDs / 16 modules** at
high+critical. The line-item count is not the number of decisions: an advisory
spanning several major-version ranges is reported once per range, so
`brace-expansion` is 15 line-items but 5 advisories, and `ws` is 3 line-items
but 1. Path counts are larger still and mean nothing for triage —
`protobufjs` reaches 1,117,571 dependency paths and is still one advisory.

**Reconciling the run-page annotation.** The CI annotation reads
`93 unique advisories — 3 critical, 56 high, 33 moderate, 4 low`, and the two
halves come from different fields in pnpm's JSON and are not expected to agree:

- `93 unique advisories` is `.advisories | length` — the count of advisories.
- `3 critical, 56 high, 33 moderate, 4 low` is `.metadata.vulnerabilities` —
  the count of *module entries*, which sums to **96**.

Measured per-severity, the two agree exactly on critical (3), high (56) and low
(4), and differ only on moderate — `metadata` says 33, unique advisories say
**30**. That gap of 3 is `metadata.vulnerabilities` counting an advisory once per
module name it covers while `.advisories` counts it once, so an advisory spanning
two module names contributes 2 to the first and 1 to the second. The specific
three are inferred, not confirmed — the parsed JSON was not retained.

**44 is the number that matters for gating.** `--audit-level=high` only fails on
high and critical, so the gated set is 3 + 56 = 59 line-items = **44 unique GHSA
IDs**. The 49 moderate/low advisories never gate the audit and need no bundle
evidence. If you are reconciling counts, use 44 against high+critical and ignore
the annotation's all-severity figure.

**Method — and its limit.** Each advisory was classified by walking its
dependency paths in the installed tree and checking, edge by edge, whether the
vulnerable package is reached through a parent's `dependencies` (a production
edge) or only through `devDependencies`/`peerDependencies` (a build edge). This
is verifiable and reproducible, but it is **conservative**: it proves
"declared as a production dependency", not "present in the shipped JS bundle".
Those differ. `expo` declares `@expo/cli`, `metro` and `react-devtools-core` as
production `dependencies`, so every advisory under them registers as a
production edge — yet none of those tools is ever imported from `app/`, so
Metro never bundles them. Settling that gap needs a real bundle
(`react-native-bundle-visualizer` is already a devDependency for exactly this).

**Result: zero advisories are provably build-only. All 59 high+critical
have at least one production edge.** So the allowlist is empty, and
`pnpm audit --audit-level=high` still exits 1. That is the correct outcome:
an empty allowlist is an honest one, and 59 accept decisions made without
bundle evidence would not be.

### The one genuinely app-reachable cluster

`@xenova/transformers` is a **production** dependency and is statically
reachable: `app/(tabs)/ai.tsx` → `lib/ai/AIService.ts:1` →
`lib/ai/models/ModelManager.ts:4` → `@xenova/transformers` → `onnxruntime-web`
→ `onnx-proto` → `protobufjs`, plus `sharp`. That is 8 critical/high advisories
that ship in the bundle.

A note recorded earlier in this file claimed `lib/ai/models/ModelManager.ts` and
`lib/ai/rag/VectorStore.ts` are "not imported by any screen or service". **That is
wrong** — see the correction block under "Product / scope" above, kept adjacent
to the original text rather than deleted. `lib/ai/` is reached from
`app/(tabs)/ai.tsx` via `AIService.ts:1` → `ModelManager.ts:4` →
`@xenova/transformers`, so these packages are in the shipped bundle. What is
accurate is narrower: `ModelManager.initialize()` is never called,
`activePipeline` stays `null`, and the vulnerable code paths (protobuf parsing,
image decoding, inference) therefore never *execute*. Shipped-but-dormant, not
absent. Treat these 8 as the highest-priority items: the fix is either wiring
the AI module up properly (which makes them live) or removing
`@xenova/transformers` from `dependencies` entirely (which takes 8 advisories
and a large unused dependency out at once).

### Unpatchable

Two advisories have no fixed version at all (`Patched versions: <0.0.0`) and so
can never be resolved by a version bump:

| Advisory | Module | Path | Patched |
| --- | --- | --- | --- |
| `GHSA-86w9-cpqp-85rv` | `node-forge` | `@expo/code-signing-certificates` | none |
| `GHSA-ch52-4w7c-c8xp` | `http-cache-semantics` | `@expo/ngrok` → `got` | none |

`braces` (`GHSA-vfj7-8cjw-p6xm`) also reports no patch. These force an
accept-or-remove decision, and `@expo/ngrok` is the most tractable of the three
— it is a devDependency used for tunneled dev builds and can simply be dropped
if remote dev is not used.

### Allowlist mechanism

`pnpm audit` in 9.15.0 has **no `--ignore` flag** — verified against
`pnpm audit --help`, which lists only `--audit-level`, `-D/--dev`, `--fix`,
`--ignore-registry-errors`, `--json`, `--no-optional`, and `-P/--prod`. The
allowlist is `pnpm.auditConfig.ignoreGhsas` in `package.json`, and it is
honoured: adding `GHSA-ch52-4w7c-c8xp` changed the summary line to
`Severity: 4 low | 33 moderate | 56 high (1 ignored) | 3 critical`.

As of this commit the list holds **44 GHSAs** — 41 absent from the shipped
bundle on all three platforms, plus 3 `nanoid` advisories accepted in-bundle.
The two categories, and the conditions for revisiting each, are recorded under
"Accepted advisories (ignoreGhsas)" below. When an advisory is genuinely
accepted, add its GHSA ID there *and* a line saying which bucket it is in and
why — an unexplained ignore is indistinguishable from a suppressed finding.

**Table mode only.** `ignoreGhsas` filters the table and its `Severity:` line,
but in 9.15.0 it does *not* filter `--json`: `.metadata.vulnerabilities` still
counts ignored advisories and `--json` still exits non-zero. The audit job
therefore runs table mode. Switching that step back to `--json` would silently
discard the entire list, which is exactly the bug this section previously
documented as working.

### Per-module summary

| Module | Sev | Unique GHSA | Vulnerable range(s) | Patched | Entry points |
| --- | --- | ---: | --- | --- | --- |
| `protobufjs` | critical | 6 | `<7.5.5`, `<=7.5.5`, `<=7.6.0` | `>=7.5.5`, `>=7.5.6`, `>=7.6.1` | `@xenova/transformers` |
| `shell-quote` | critical | 2 | `>=1.1.0 <=1.8.3`, `<=1.8.4` | `>=1.8.4`, `>=1.9.0` | `expo`, `@react-native-async-storage/async-storage` |
| `tar` | critical | 3 | `<=7.5.17`, `<=7.5.18`, `<=7.5.20` | `>=7.5.18`, `>=7.5.19`, `>=7.5.21` | `@expo/cli`, `expo`, `jest-expo`, `sentry-expo` |
| `@xmldom/xmldom` | high | 8 | `>=0.7.0 <=0.8.13`, `>=0.7.0 <=0.8.14` | `>=0.8.14`, `>=0.8.15` | `expo`, `expo-application` |
| `brace-expansion` | high | 5 | `1.x <1.1.20`, `2.x <2.1.6`, `4.x <5.0.11` | `>=1.1.20`, `>=2.1.6`, `>=5.0.11` | `expo`, `@expo/cli`, `detox`, `eslint*`, `jest*`, `storybook*` |
| `braces` | high | 1 | `<=3.0.3` | **none** | `expo`, `@react-native-async-storage/async-storage` |
| `browserslist` | high | 2 | `<=4.28.6` | `>=4.28.7` | `@react-native-async-storage/async-storage` |
| `http-cache-semantics` | high | 1 | `<=4.2.0` | **none** | `@expo/ngrok` |
| `image-size` | high | 2 | `>=0.6.3 <=2.0.2`, `>=1.2.0 <=2.0.2` | `>=2.0.3` | `expo`, `react-native` |
| `js-yaml` | high | 3 | `3.x <3.15.2`, `4.x <4.3.0`, `4.x <4.3.1`, `4.x <4.3.2` | `>=3.15.2`, `>=4.3.2` | `expo`, `@expo/cli`, `babel-jest`, `jest-expo` |
| `nanoid` | high | 3 | `<3.3.12`, `<3.3.16`, `<3.3.18` | `>=3.3.18` | `expo`, `expo-application`, `expo-blur` |
| `node-forge` | high | 1 | `<=1.4.0` | **none** | `@expo/code-signing-certificates` |
| `postcss` | high | 2 | `<=8.5.11`, `<=8.5.17` | `>=8.5.12`, `>=8.5.18` | `expo`, `expo-*` |
| `sharp` | high | 2 | `<0.35.0`, `<0.35.4` | `>=0.35.0`, `>=0.35.4` | `@xenova/transformers` |
| `undici` | high | 2 | `<6.27.0`, `>=6.7.0 <6.28.1` | `>=6.27.0`, `>=6.28.1` | `@expo/cli`, `expo` |
| `ws` | high | 1 | `>=6.0.0 <6.2.4`, `>=7.0.0 <7.5.11`, `>=8.0.0 <8.21.0` | `>=6.2.4`, `>=7.5.11`, `>=8.21.0` | `expo`, `@expo/cli`, `detox` |

### Suggested order of work

1. **Decide `@xenova/transformers`** — remove it or wire it up. Resolves 8
   advisories including the only critical one that ships.
2. **Drop `@expo/ngrok`** if remote dev builds are unused — removes an
   unpatchable advisory and a devDependency.
3. **Bundle-analyse** with `react-native-bundle-visualizer` to separate
   declared-production edges from actually-bundled code. This is what turns the
   remaining ~48 advisories from "unknown" into a real accept/fix decision.
4. **Only then** populate the allowlist and remove `continue-on-error`.
### Bundle reachability (measured)

**Target: iOS Metro bundle.** Measured 2026-10-03 on `2686b4d` with
`npx expo export --platform ios --dump-sourcemap`, twice — once producing Hermes
bytecode (`entry-*.hbc`, 5.13 MB) and once plain JS (`entry-*.js`, 5.63 MB) via
`--no-bytecode`. Both builds bundled **2447 modules / 2454 sourcemap sources**,
covering **105 distinct packages**. Both were analysed; both agree.

**Tooling note: `react-native-bundle-visualizer@3.2.0` was tried and did not
work here.** Its default mode shells out to `react-native bundle`, which needs
`@react-native-community/cli` — absent, as expected in an Expo managed project
where that CLI is not a dependency. Its `--expo` mode was not reached, and
calling `source-map-explorer@2.5.3` directly against either the `.hbc` (it
cannot read Hermes bytecode) or Metro's `.js.map` (format it does not parse)
failed with an opaque error both times. Rather than fight it, the measurement
below falls back to analysing the export's own sourcemap, which is stronger
evidence for this question anyway: `sources` gives exactly which module files
Metro included, and `sourcesContent` gives their size.

**Sizes are `sourcesContent` byte lengths — source bytes, not gzipped bundle
contribution.** They indicate presence and rough weight, not shipped size.

#### Sanity check performed before trusting any "absent"

Absence is only meaningful if the matcher works, so known-present packages were
checked first:

| Package | Found | Files | | Package | Found | Files |
|---|:--:|---:|---|---|:--:|---:|
| `react-native` | ✅ | 421 | | `jest` | ✅ absent | 0 |
| `@react-navigation/*` | ✅ | 170 | | `eslint` | ✅ absent | 0 |
| `@nozbe/watermelondb` | ✅ | 101 | | `typescript` | ✅ absent | 0 |
| `expo-router` | ✅ | 116 | | `detox` | ✅ absent | 0 |
| `expo` | ✅ | 33 | | `@babel/core` | ✅ absent | 0 |
| `zustand`, `react`, `expo-secure-store` | ✅ | 4/6/3 | | `@expo/cli-server` | ✅ absent | 0 |

9 of 10 must-be-present packages resolved with substantial file counts, so the
matcher is sound.

**Disclosed limitation.** The tenth, `expo-sqlite`, also came back absent even
though the app depends on it — `@nozbe/watermelondb/adapters/sqlite/*` is
bundled but `expo-sqlite` itself is not, because WatermelonDB loads it
dynamically. So this method reports **absent for dynamically-imported modules**.
Nothing in the triage-16 set is dynamically imported by the app, but a future
entry could be, and an "absent" verdict should be read as "not in the initial
bundle" rather than "unreachable at runtime".

#### Results — 16 modules, 44 unique GHSAs

| Module | In bundle? | Size (source bytes) | Evidence |
|---|:--:|---:|---|
| `protobufjs` | **no** | — | absent from both sourcemaps; 0 of 6 GHSAs bundled |
| `sharp` | **no** | — | absent. Native `.node` addon plus JS shim — neither shipped |
| `shell-quote` | **no** | — | absent |
| `tar` | **no** | — | absent |
| `undici` | **no** | — | absent |
| `js-yaml` | **no** | — | absent |
| `image-size` | **no** | — | absent |
| `brace-expansion` | **no** | — | absent (0 of 5 GHSAs bundled) |
| `braces` | **no** | — | absent |
| `node-forge` | **no** | — | absent |
| `http-cache-semantics` | **no** | — | absent |
| `ws` | **no** | — | absent (0 of 1 GHSAs bundled) |
| `@xmldom/xmldom` | **no** | — | absent (0 of 8 GHSAs bundled) |
| `browserslist` | **no** | — | absent |
| `postcss` | **no** | — | absent |
| **`nanoid`** | **YES** | **497 B**, 1 module | `nanoid@3.3.11` → `nanoid/non-secure/index.js` |

**15 of 16 modules are absent. 3 of 44 GHSAs are in the shipped bundle — all
three are `nanoid`.** Installed `nanoid@3.3.11` is below every patched threshold
in the table (`>=3.3.12`, `>=3.3.16`, `>=3.3.18`), so
`GHSA-28wg-ghj8-5hjv`, `GHSA-2v37-7h3g-55p8` and `GHSA-xwg4-73v4-xw9w` are all
live. Only the `non-secure` entry point ships, which is the `Math.random()`
generator the advisories concern. Nothing in `app/` or `lib/` imports `nanoid`
directly, so it arrives transitively — most likely via `expo-router` or
`@xenova/transformers` — and the exact importer was not traced.

#### The `@xenova/transformers` result is the interesting one

This corrects the urgency of the correction recorded earlier in this file.
`@xenova/transformers` **is** in the bundle — 16 source modules
(`transformers.js`, `pipelines.js`, `backends/onnx.js`, `utils/image.js`, …) —
along with `onnxruntime-web`, `onnxruntime-common` and `@huggingface/jinja`.
**But `protobufjs`, `onnx-proto` and `sharp` are all absent.** `@xenova/transformers`
resolves those lazily at inference time rather than through static imports, so
Metro never pulls them in.

So the 8 advisories attributed to that dependency — 6 `protobufjs` (including
the tree's only critical, `GHSA-xq3m-2v4x-88gg`) and 2 `sharp` — are **not in
the shipped bundle**. The dormant-module finding stands as a supply-chain and
bundle-size problem, and as a landmine the moment the AI module is wired up, but
it is not an active exposure today. That lowers its priority relative to `nanoid`
despite the severity labels.

#### Next decision

- **`nanoid` (3 GHSAs, in bundle) — fix, do not accept.** A patch exists
  (`>=3.3.18`), it is a `dev`-adjacent transitive with no behavioural risk to
  upgrade, and it is the only measured live exposure in the gated set. Resolve it
  with a `pnpm.overrides` entry or by nudging the parent, then re-measure.
- **41 GHSAs across 15 modules (not in bundle) — eligible for
  `auditConfig.ignoreGhsas`, one line each here citing this measurement.** Not
  added in this commit: an ignore is a standing claim that a future dependency
  change will not make the package reachable, and that claim needs re-checking
  whenever these advisories are re-triaged. The entry is also only trustworthy
  for the **iOS** bundle measured here — see below.
- **Re-measure before closing the gate.** This covered iOS only. Android and web
  were not analysed, and `@react-native-async-storage/async-storage`, `expo` and
  `react-native` are shared across all three, so a platform-specific import could
  differ. Run the same export for `--platform android` and `--platform web` before
  treating "not in bundle" as universal, and before `continue-on-error` comes off.
- **Separately: `nanoid`'s importer.** If it comes from `@xenova/transformers`,
  removing that dependency clears these 3 GHSAs as a side effect, which would
  make the audit triage and the dead-module question the same piece of work.
#### Extended to Android and web (2026-10-03, same commit as the table above)

`npx expo export --platform <p> --no-bytecode --dump-sourcemap` for each target,
analysed identically via the `sources` array.

| Package | iOS | Android | Web | Size (source bytes) | Evidence |
|---|:--:|:--:|:--:|---:|---|
| `protobufjs` | no | no | **n/a** | — | absent 2/2 measured platforms |
| `sharp` | no | no | **n/a** | — | absent 2/2; native addon + JS shim both unshipped |
| `shell-quote` | no | no | **n/a** | — | absent 2/2 |
| `tar` | no | no | **n/a** | — | absent 2/2 |
| `undici` | no | no | **n/a** | — | absent 2/2 |
| `js-yaml` | no | no | **n/a** | — | absent 2/2 |
| `image-size` | no | no | **n/a** | — | absent 2/2 |
| `brace-expansion` | no | no | **n/a** | — | absent 2/2; 0 of 5 GHSAs bundled |
| `braces` | no | no | **n/a** | — | absent 2/2 |
| `node-forge` | no | no | **n/a** | — | absent 2/2 |
| `http-cache-semantics` | no | no | **n/a** | — | absent 2/2 |
| `ws` | no | no | **n/a** | — | absent 2/2 |
| `@xmldom/xmldom` | no | no | **n/a** | — | absent 2/2; 0 of 8 GHSAs bundled |
| `browserslist` | no | no | **n/a** | — | absent 2/2 |
| `postcss` | no | no | **n/a** | — | absent 2/2 |
| **`nanoid`** | **YES** | **YES** | **n/a** | **497 B**, 1 module | `nanoid/non-secure/index.js` in both |
| `@xenova/transformers` | 16 mod | 16 mod | **n/a** | — | shim ships; `protobufjs`/`onnx-proto`/`sharp` absent |
| `onnxruntime-web` | 1 mod | 1 mod | **n/a** | — | present in both |

**No module differs between iOS and Android.** All 16 agree, as do the
`@xenova`/`onnxruntime` counts. Bundle sizes are near-identical (iOS 5.63 MB /
2454 sources, Android 5.63 MB / 2450 sources; 105 distinct packages on both).

**Web could not be measured — the export fails to build.** Not a tooling
problem:

```
Error: Unable to resolve module better-sqlite3 from
node_modules/.pnpm/@nozbe+watermelondb@0.27.1/node_modules/@nozbe/watermelondb/
adapters/sqlite/sqlite-node/Database.js
```

WatermelonDB's `sqlite-node` adapter requires `better-sqlite3`, which is not a
dependency of this project. So **`npm run build` / web export is currently
broken**, independently of any security question. This is a real finding and is
recorded as one; it also means the web platform has **no** bundle-reachability
evidence, and "not in bundle" is therefore established for iOS and Android only.

**Per-platform sanity check.** Both native platforms resolve the probe packages
with substantial counts, so absence is meaningful on both:

| Package | iOS | Android |
|---|---:|---:|
| `react-native` | 421 | 419 |
| `@react-navigation/*` | 170 | 170 |
| `expo-router` | 116 | 114 |
| `@nozbe/watermelondb` | 101 | 101 |
| `expo` | 34 | 34 |

(`@react-navigation/*` counts sub-packages — `native`, `core`, `routers`,
`bottom-tabs`, `elements`, `native-stack`. An earlier single-name probe reported
0 for `@react-navigation`; that was a probe artifact, not a real absence.)

#### `nanoid` — the trace changes the recommended fix

`pnpm why nanoid` shows two production paths and one dev path. The path that
actually reaches the bundle is:

```
expo (dependencies)
└─ expo-router
   └─ @react-navigation/core | native | routers
      └─ nanoid 3.3.11
```

A second, shorter production path runs `expo → @expo/cli → @expo/metro-config →
postcss → nanoid`, but that one is build tooling and is absent from both
bundles, consistent with `postcss` being absent. Dev-only entries
(`@expo/cli`, `jest-expo`, `@storybook/addon-ondevice-controls`) are irrelevant
to reachability.

**But the importers ask for `nanoid/non-secure` explicitly**, at 9 call sites:

```
@react-navigation/core/lib/module/PreventRemoveProvider.js   from 'nanoid/non-secure'
@react-navigation/core/lib/module/usePreventRemove.js        from 'nanoid/non-secure'
@react-navigation/core/lib/module/useRegisterNavigator.js    from 'nanoid/non-secure'
@react-navigation/native/lib/module/createMemoryHistory.js   from 'nanoid/non-secure'
@react-navigation/routers/lib/module/BaseRouter.js          from 'nanoid/non-secure'
@react-navigation/routers/lib/module/createRouteFromAction.js
@react-navigation/routers/lib/module/DrawerRouter.js
@react-navigation/routers/lib/module/StackRouter.js
@react-navigation/routers/lib/module/TabRouter.js
```

That is a deep import of the `Math.random()`-backed generator, chosen upstream —
not a resolution accident Metro introduced. `nanoid`'s own `package.json` maps
`exports["."]["react-native"]` to `./index.browser.js`, so the bundled
`non-secure/index.js` came from these explicit specifiers.

**Consequence: a `pnpm.overrides` bump to `>=3.3.18` may not actually fix this.**
It satisfies the advisory scanner, because the scanner only compares versions,
but whether 3.3.18's `/non-secure` entry stops using `Math.random()` was **not
verified** and must be before relying on it. Do not record this as fixed on the
strength of a version number alone.

The override that would be added, if the decision is to force the upgrade:

```json
{
  "pnpm": {
    "overrides": {
      "nanoid@<3.3.18": "3.3.18"
    }
  }
}
```

Scoped to `<3.3.18` so a future major is not silently downgraded. Not applied.

**And the more important question is whether this needs fixing at all.**
`@react-navigation` uses `nanoid/non-secure` to generate *route keys and
navigation-state IDs* — not security tokens, not session material, not anything
an attacker benefits from predicting. For that use, a `Math.random()` ID is a
predictability weakness in the general sense and not a vulnerability in this
app's threat model: there is no privilege boundary keyed on a route key. The
defensible call is likely **accept with reasoning** rather than fix, and that
is a judgement for a human, not something to settle by bumping a version.

#### Next decision (supersedes the one above)

1. **`nanoid` (3 GHSAs, in bundle, both native platforms) — decide accept or
   fix, and do not let a version bump stand in for the decision.** Fix requires
   either an override *plus* verification that 3.3.18's `/non-secure` is not
   `Math.random()`, or an upstream `@react-navigation` change. Accept requires
   recording that the affected IDs are navigation keys, not secrets. Either way
   the entry belongs in `auditConfig.ignoreGhsas` or in a documented fix, not in
   silence.
2. **41 absent GHSAs across 15 modules — not yet eligible for the ignore list.**
   The evidence covers iOS and Android only. Web cannot be produced until
   `better-sqlite3` is resolved, so "absent on every platform that can currently
   be built" is the strongest claim available, and that is weaker than "absent
   everywhere".
3. **Fix the web export first** (`better-sqlite3` missing, or exclude
   `sqlite-node` from the web build). It is a broken build independent of
   security, and it is the only thing standing between the current evidence and
   three-platform coverage.
4. **The `@xenova/transformers` decision is now decoupled from security.** With
   0 of 8 its advisories in the bundle, removing it is justified on bundle size
   and dead-code grounds alone — the security urgency in earlier notes was wrong.
5. **Do not remove `continue-on-error` yet.** It should come off only once an
   ignore list exists and the gated set is either empty or fully justified.
   (Both conditions are met as of this commit, which makes the gate real; the
   flag comes off in the commit that follows.)
#### Web measured — three-platform table now complete (after the adapter fix)

The web export previously failed with `Unable to resolve module better-sqlite3`
from `@nozbe/watermelondb/adapters/sqlite/sqlite-node/Database.js`. Root cause:
`adapters/sqlite` has **no web implementation**. Its `makeDispatcher/index.js`
— the non-native variant Metro selects for web — unconditionally requires
`../sqlite-node/DatabaseBridge` at line 8, which requires `better-sqlite3`. Only
`makeDispatcher/index.native.js` avoids it. `metro.config.js` configured no
`resolver.platforms` or platform alias, so the fix belonged in source, not in
the resolver. The adapter is now selected at module level (`adapter.ts` /
`adapter.web.ts`); see the commit for why a `Platform.OS` ternary inside one
file would not have worked.

`sqlite-node` / `better-sqlite3` matches in the web bundle: **0**.
`@nozbe/lokijs` is bundled instead (3 modules).

| Package | iOS | Android | Web | Size (source bytes) | Evidence |
|---|:--:|:--:|:--:|---:|---|
| `protobufjs` | no | no | no | — | absent 3/3; 0 of 6 GHSAs bundled |
| `sharp` | no | no | no | — | absent 3/3; native addon + JS shim both unshipped |
| `shell-quote` | no | no | no | — | absent 3/3 |
| `tar` | no | no | no | — | absent 3/3 |
| `undici` | no | no | no | — | absent 3/3 |
| `js-yaml` | no | no | no | — | absent 3/3 |
| `image-size` | no | no | no | — | absent 3/3 |
| `brace-expansion` | no | no | no | — | absent 3/3; 0 of 5 GHSAs bundled |
| `braces` | no | no | no | — | absent 3/3 |
| `browserslist` | no | no | no | — | absent 3/3 |
| `node-forge` | no | no | no | — | absent 3/3 |
| `http-cache-semantics` | no | no | no | — | absent 3/3 |
| `ws` | no | no | no | — | absent 3/3; 0 of 1 GHSAs bundled |
| `@xmldom/xmldom` | no | no | no | — | absent 3/3; 0 of 8 GHSAs bundled |
| `postcss` | no | no | no | — | absent 3/3 |
| **`nanoid`** | **YES** | **YES** | **YES** | **497 B**, 1 module | `nanoid/non-secure/index.js` on all three |

**No module differs across iOS, Android and web.** The three-platform evidence
is complete. Bundle sizes: iOS 5.63 MB / 2448 modules, Android 5.63 MB / 2444,
web 4.59 MB / 2131.

**Sanity check per platform.** All probes resolve except one, and that one is
correct behaviour rather than a measurement failure:

| Package | iOS | Android | Web |
|---|---:|---:|---:|
| `expo-router` | 116 | 114 | 117 |
| `@nozbe/watermelondb` | 101 | 101 | 104 |
| `expo` | 34 | 34 | 29 |
| `@react-navigation/*` | 170 | 170 | 163 |
| `react-native` | 421 | 419 | **0** — expected |
| `react-native-web` | n/a | n/a | 193 |

Web reports 0 for bare `react-native` because Expo web resolves it to
`react-native-web` (193 modules present). That is the platform working as
designed, and it is the one probe that legitimately differs.

### Advisory disposition: nanoid

**Status: ACCEPTED with reasoning (not fixed).**

**Trace.** `nanoid@3.3.11` arrives via `expo -> expo-router ->
@react-navigation/*` (`PreventRemoveProvider`, `usePreventRemove`,
`useRegisterNavigator`, `createMemoryHistory`, `BaseRouter`,
`createRouteFromAction`, `DrawerRouter`, `StackRouter`, `TabRouter`). All 9
call sites import `'nanoid/non-secure'` explicitly — an upstream choice, not a
Metro resolution artifact. A second production path
(`expo -> @expo/cli -> @expo/metro-config -> postcss -> nanoid`) is build
tooling and is absent from all three bundles.

**Applicable GHSAs.** `GHSA-28wg-ghj8-5hjv`, `GHSA-2v37-7h3g-55p8`,
`GHSA-xwg4-73v4-xw9w`.

**Why not fixed.** A `pnpm.overrides` entry pinning `nanoid@<3.3.18` to
`3.3.18` would satisfy a version scanner but would not change which generator
the caller uses — `@react-navigation` imports the `/non-secure` path by design.
Whether 3.3.18's `/non-secure` stops using `Math.random()` is unverified
upstream and not this repo's call. Recording a version bump as a fix would
claim remediation that was never demonstrated.

**Why accepted.** The values generated are route keys and navigation-state IDs
— not tokens, not session material, not anything gated on unpredictability.
There is no privilege boundary in this app keyed on a route key, so the
vulnerability class (predictable ID generation) does not apply to this use. The
presence of `nanoid/non-secure/index.js` in all three bundles is confirmed, and
accepted here deliberately rather than overlooked.

**Revisit when.** `@react-navigation` drops `nanoid`, or the audit tooling
starts flagging the `/non-secure` deep import by path rather than by version —
which would make this visible without a bundle re-measurement.

**No `ignoreGhsas` entry is added in this commit.** This section records the
decision; the ignore itself is deferred so that all accepted advisories land in
one reviewable change, with the three-platform measurement to back them.

#### Next decision

1. **The ignore list is now unblocked.** Evidence covers all three platforms for
   all 16 modules, with per-platform sanity checks recorded. 41 GHSAs across 15
   modules are eligible for `auditConfig.ignoreGhsas`, each citing this section.
   The three `nanoid` GHSAs are accepted on the reasoning above. That is 44 —
   the entire gated set — which would let `--audit-level=high` exit 0 and
   `continue-on-error` finally come off.
2. **Before writing it, confirm the web build actually runs, not just bundles.**
   `npx expo export --platform web` now completes, but no one has opened the
   output. LokiJS on IndexedDB with `useIncrementalIndexedDB: true` and the v1
   -> v2 `DROP COLUMN` migration is untested at runtime.
3. **Re-run this measurement whenever these advisories are re-triaged.** An
   `ignoreGhsas` entry is a standing claim that the package has not become
   reachable, and only a bundle re-measurement can catch that.
4. **`@xenova/transformers` removal is now a size/dead-code decision**, not a
   security one — 0 of its 8 GHSAs are bundled on any platform.

### Accepted advisories (ignoreGhsas)

Two categories. Both suppress `--audit-level=high`. The reasons differ and
must not be conflated on re-triage.

**Category A — not in bundle (41 GHSAs across 15 modules)**

Modules: protobufjs, sharp, shell-quote, tar, undici, js-yaml, image-size,
brace-expansion, braces, node-forge, http-cache-semantics, ws,
@xmldom/xmldom, browserslist, postcss.

Evidence: absent from the `sources` array of `expo export --dump-sourcemap`
on iOS (5.63 MB, 2448 modules), Android (5.63 MB, 2444), and Web
(4.59 MB, 2131). Per-platform sanity probes recorded in the measurement
section above.

Standing claim: these packages are not reachable from the shipped bundle
on any platform we build. Re-verify whenever dependency trees shift
(expo upgrade, RN upgrade, or any change to @react-navigation /
@expo/vector-icons which is where nanoid and most of these arrive).

**Category B — in bundle, accepted use (3 GHSAs)**

Package: nanoid@3.3.11 via expo → expo-router → @react-navigation/*
(9 explicit `nanoid/non-secure` imports). See "Advisory disposition:
nanoid" above for the full trace.

Standing claim: `nanoid/non-secure` generates route keys and
navigation-state IDs. No privilege boundary is keyed on unpredictability.
A pnpm.overrides bump to 3.3.18 would satisfy a version scanner without
changing which generator the caller uses — it would be theatre.

Re-verify if @react-navigation adopts a different ID source, or if nanoid
is used anywhere in this repo for anything other than navigation.

## pnpm resolution — expo/bin/cli entry-point sensitivity

Calling `node node_modules/expo/bin/cli export ...` fails with
MODULE_NOT_FOUND for babel-preset-expo. Calling the same export through
`npx expo` or `pnpm exec expo` succeeds. The direct-path invocation's
require stack does not reach .pnpm/node_modules; the shim's does.
Declaring babel-preset-expo as a dependency removes this specific
occurrence, but the underlying entry-point sensitivity is unexplained.
Instrument pnpm's resolution when there is time; the general class —
"direct node invocation of a bin file resolves differently than through
the .bin shim" — is worth understanding, because it can hide real bugs.
## Session integrity — persisted dbId across reinstall or restore

babel-preset-expo / dbId fix (e7665bd) persists the WatermelonDB row id
into SecureStore so cold start can reattach domain data. WatermelonDB
assigns random ids per row, so a dbId persisted by one install and a
database restored or reinstalled under another will not match — the
same "dbId points at a row that no longer exists" state e7665bd repairs
on cold start, except findByDeviceId would also fail because deviceId
is regenerated on fresh install. There is no re-derivation path for that
case. Options: regenerate deviceId from a stable platform identifier
(Keychain-stored on iOS survives reinstall; Android Keystore does not
survive uninstall), or accept that reinstall = fresh start, and document
it. Do not fix yet — this is a known limit of the current design, not a
regression.

## XP persistence — still lost on restart

**Status: open.** Not a v1.1 launch blocker by the review's Q1, which was `dbId`
and `XPBar` -- both fixed in `e7665bd` and `d53a020`. This is the next item.

Symptoms: `useAuthStore().addXP()` mutates `user.xp`, `level` and `streak` on
the in-memory Zustand profile. The store's `partialize` omits `user` entirely, so
none of it is written back to SecureStore, and nothing else persists it. Every XP
award is therefore lost on cold start. The `users` table has `xp`, `level` and
`xp_to_next_level` columns, but no production code writes them after onboarding.

Note that `XPBar` now reads the live store, so the bar is correct *within* a
session and resets across one. `User.addXP()` -- the model method that would write
through SQLite -- exists and has zero production callers; it also needs a
`database.write()` wrapper because `Model.update()` throws outside a writer.

Fix is a genuine design decision, not a patch. Either:

1. Include `user` in `partialize`, after deciding what is safe to persist
   (it carries `dbId`, which must stay consistent with the row), or
2. Write XP through `User.addXP()` inside `database.write()` and rehydrate it on
   init, the same way `dbId` is re-derived.

Option 2 keeps SQLite as the single source of truth and matches the rest of the
data layer. Option 1 is less code and keeps the store authoritative, at the cost of
two stores that can disagree. Do not pick this without a decision.

## Branch protection — still unverified

**Status: open, blocked on access.** The audit job's display name changed at
`13559ee` (`audit` -> `audit (advisory)`), and the job id stayed `audit`. A
required-check string in branch protection is keyed on the *display name*, so if it
was configured before that rename it may still be waiting on a context that no
longer exists -- in which case protection is either inert or silently blocking.

This is unreadable without repository admin auth, so it has never been confirmed.
The job id was deliberately preserved when the name changed, so `needs:` references
and id-keyed config keep resolving; it is only the name-keyed required check that
is at risk.

Verify once someone has access: confirm the required status checks list a context
that exists, and that a deliberately failing run is actually blocked.
