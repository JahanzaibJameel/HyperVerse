# SDK 54 dependency alignment

Aligns the Expo module graph to the versions SDK 54 was built against, so the
auth hardening in `256183b` runs against the packages it was written for rather
than three majors behind.

Baseline captured by `npx expo install --check` before any change; see
`docs/sdk-54-alignment-preflight.txt` for the verbatim output.

`npx expo install --check` after the change reports **`Dependencies are up to
date`** — no remaining mismatches.

## 1. Pre/post versions

`expo install --fix` resolved every target; no version below was chosen by hand.

| Package | Pre | Post |
| :-- | :-- | :-- |
| `expo` | 54.0.33 | 54.0.37 |
| `expo-constants` | 18.0.13 | 18.0.14 |
| `expo-crypto` | 14.0.2 | 15.0.9 |
| `expo-file-system` | 18.0.12 | 19.0.24 |
| `expo-font` | 14.0.11 | 14.0.12 |
| `expo-glass-effect` | 0.1.9 | 0.1.10 |
| `expo-linking` | 8.0.11 | 8.0.12 |
| `expo-local-authentication` | 14.0.1 | 17.0.9 |
| `expo-router` | 6.0.23 | 6.0.24 |
| `expo-secure-store` | 12.8.1 | 15.0.8 |
| `expo-splash-screen` | 0.27.7 | 31.0.13 |
| `expo-sqlite` | 13.2.2 | 16.0.10 |
| `expo-status-bar` | 1.12.1 | 3.0.9 |
| `expo-system-ui` | 3.0.7 | 6.0.9 |
| `expo-web-browser` | 13.0.3 | 15.0.11 |
| `react-native-keyboard-controller` | 1.21.5 | 1.18.5 |

Also raised by `--fix` and therefore part of this alignment:
`eslint-config-expo` 8.0.1 → 10.0.0 (a devDependency; see §5).

## 2. Grouped by bump type

**Major (10).** `expo-crypto` 14→15 · `expo-file-system` 18→19 ·
`expo-local-authentication` 14→17 · `expo-secure-store` 12→15 ·
`expo-splash-screen` 0.27→31 (a versioning reset to the unified scheme, not a
30-major jump) · `expo-sqlite` 13→16 · `expo-status-bar` 1→3 ·
`expo-system-ui` 3→6 · `expo-web-browser` 13→15 · `eslint-config-expo` 8→10.

**Minor (0).** None.

**Patch (6).** `expo` 54.0.33→54.0.37 · `expo-constants` 18.0.13→18.0.14 ·
`expo-font` 14.0.11→14.0.12 · `expo-glass-effect` 0.1.9→0.1.10 ·
`expo-linking` 8.0.11→8.0.12 · `expo-router` 6.0.23→6.0.24.

**Downgrade (1).** `react-native-keyboard-controller` 1.21.5→1.18.5. The
installed version overshot the SDK 54 expectation via a `^` range; `expo
install --fix` pins it correctly where `npm update` would not.

## 3. Code changes required

One package required source changes: **`expo-file-system`**, whose 19.0.0
breaking change made the modern `Directory`/`File` API the default export and
moved the imperative API to `expo-file-system/legacy`.

- `lib/ai/models/ModelManager.ts:3`
- `lib/ai/rag/VectorStore.ts:3`

Both changed from `import * as FileSystem from 'expo-file-system'` to
`'expo-file-system/legacy'`, each with a comment recording why.

All nine legacy symbols these files call were verified present in the 19.0.24
legacy entry point (`legacy.ts` → `src/legacy` → re-exports `FileSystem` +
`FileSystem.types`) **before** the edit, and confirmed resolving by
`tsc --noEmit` afterwards:

```
documentDirectory              PRESENT      getInfoAsync            PRESENT
makeDirectoryAsync             PRESENT      readAsStringAsync       PRESENT
writeAsStringAsync             PRESENT      readDirectoryAsync      PRESENT
deleteAsync                    PRESENT      getFreeDiskStorageAsync PRESENT
createDownloadResumable        PRESENT
```

**`app.json` also gained a config-plugin entry.** `expo install --fix` added
`"expo-secure-store"` to `plugins`, and this commit configures it:

```json
["expo-secure-store", { "faceIDPermission": "Allow HyperVerse to use Face ID to protect your data." }]
```

This is load-bearing for the auth fix, not cosmetic. The plugin injects
`NSFaceIDUsageDescription`, without which `authenticateAsync` fails on a real
iOS device and App Store review rejects the build. No manual
`ios.infoPlist` entry exists, so the plugin is the single source of truth.

## 4. Test-mock changes

Rewrites were confined to `jest.setup.js`. **No test assertion was changed
anywhere in this work.**

- **`expo-local-authentication`** — the mock exposed 4 exports against the real
  module's 6 functions + 2 enums. Added `getEnrolledLevelAsync`,
  `cancelAuthenticate`, `SecurityLevel`, `AuthenticationType`. Enum values were
  checked against the built `LocalAuthentication.types.js`: numeric and
  matching (`NONE: 0`, `SECRET: 1`, `BIOMETRIC_WEAK: 2`, `BIOMETRIC_STRONG: 3`,
  `FINGERPRINT: 1`, `FACIAL_RECOGNITION: 2`, `IRIS: 3`). `SecurityLevel.BIOMETRIC`
  is deliberately omitted — the real enum resolves it through a
  deprecation-warning getter that depends on `Platform`.
- **`expo-secure-store`** — the mock exposed 4 exports against 6 functions + 7
  constants. Added the synchronous `getItem`/`setItem`,
  `canUseBiometricAuthentication`, and all seven accessibility constants. No
  constant was renamed between 12.8.1 and 15.0.8, and this repo never passes
  `keychainAccessible`, so their values are inert.
- **`expo-file-system`** — the original mock had drifted: it covered the legacy
  API only, and was missing `readDirectoryAsync` and
  `getFreeDiskStorageAsync`. With the imports moved, both the legacy path and
  the modern default path are mocked.

Why any of this mattered: `jest.mock` replaces a module wholesale, so an export
absent from the mock is `undefined` to a caller. The gaps would have surfaced as
`undefined is not a function` at the moment someone reached for the API, not at
the moment the mock was written.

## 5. `eslint-config-expo`

`--fix` bundled this devDependency into the batch and offers no per-package
exclusion, so it moved 8.0.1 → 10.0.0 rather than being held back. Lint was
re-verified afterwards and passes with zero errors and zero warnings, so the
repo's dual ESLint setup (`.eslintrc.js` legacy + `eslint.config.mjs` flat)
survived the two-major bump. Cleanup of that duplication is tracked in
`docs/followups.md`.

## Changelog review

Reviewed before running `npx expo install --fix`, so that any break would be
known in advance rather than discovered through a failing build. Grouped by
risk tier rather than alphabetically.

Method note: verdicts are derived from the upstream `CHANGELOG.md` for each
package on the `sdk-54` branch, cross-checked against this repo's actual imports
(`git grep` over tracked `*.ts`/`*.tsx`) and against the installed `.d.ts`
surface. Where a version's `.d.ts` could not be read without installing, that is
stated explicitly rather than assumed.

### Tier 1 — Auth boundary

The previous fix (`256183b`) made app lock depend entirely on these two packages.
Their automated tests mock both, so a green suite does not prove the installed
API matches the mock.

**expo-local-authentication — 14.0.1 → ~17.0.9 (3 majors)**

1. Versions bridged: 14.0.1 → 17.0.9.
2. Breaking affecting this repo: `LocalAuthenticationResult.error` is retyped
   from `string` to the `LocalAuthenticationError` string union
   (`'not_enrolled' | 'user_cancel' | 'app_cancel' | 'not_available' | 'lockout'
   | 'no_space' | 'timeout' | 'unable_to_process' | 'unknown' | 'system_cancel'
   | 'user_fallback' | 'invalid_context' | 'passcode_not_set'
   | 'authentication_failed'`). The repo already narrows on the *value*
   (`/user[_ ]?cancel/i.test(error)` in `authStore`'s service), and
   `Lib/services/AuthService.ts:217` narrows on the *type* to work around the
   14.x union split. Both remain valid: the value test is a subset of the union
   and the type narrowing is still required, because `error` still exists only
   on the `{ success: false }` variant. The narrowing fix stays. `17.0.9` also
   fixes concurrent `authenticateAsync` calls resolving the active prompt's
   promise, which directly benefits the unlock screen's retry button.
3. Breaking not affecting this repo: `promptSubtitle` / `promptDescription`
   (17.0.0) are additive; iOS deployment target 15.1 and min macOS 11.0 (15.0.0,
   16.0.0) are build-environment constraints, and this repo declares no
   `macos`/`ios.deploymentTarget` in `app.json`. `SecurityLevel.BIOMETRIC` was
   deprecated at 14.0.0, before the installed version, and the repo never
   references it.
4. Verdict: **SAFE**. `authenticateAsync` keeps all four options this repo
   passes (`promptMessage`, `fallbackLabel`, `cancelLabel`,
   `disableDeviceFallback`) — verified present in the 17.x
   `LocalAuthenticationOptions` type. No call-site change expected.

**expo-secure-store — 12.8.1 → ~15.0.8 (3 majors)**

1. Versions bridged: 12.8.1 → 15.0.8.
2. Breaking affecting this repo: none in the JS API. `getItemAsync`,
   `setItemAsync`, `deleteItemAsync`, `isAvailableAsync` and the accessibility
   constants (`WHEN_UNLOCKED`, `AFTER_FIRST_UNLOCK`, `ALWAYS`,
   `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, `WHEN_PASSCODE_SET_THIS_DEVICE_ONLY`,
   `ALWAYS_THIS_DEVICE_ONLY`, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`) are
   unchanged in name. The repo calls only `getItemAsync` / `setItemAsync` /
   `deleteItemAsync` through `lib/storage.ts` and never passes
   `keychainAccessible`, so the constant values are not load-bearing.
3. Breaking not affecting this repo: sync `getItem` / `setItem` were **not**
   deprecated or removed — they remain in 15.x and the repo does not use them
   anyway. `requireAuthentication` semantics (12.0.0), the Android backup
   config plugin (14.0.0) and iOS access groups (14.2.0) are opt-in features the
   repo does not enable. `13.0.2` fixed decryption after Android Auto Backup,
   which is a strict improvement for a keystore-backed profile.
4. Verdict: **SAFE**.

> The `jest.setup.js` and per-suite mocks of `expo-secure-store` stub only
> `getItemAsync` / `setItemAsync` / `deleteItemAsync` / `isAvailableAsync`, which
> is the exact set this repo calls. No mock rewrite is required by this bump. The
> mocks remain a real limitation — they prove our call sites are internally
> consistent, not that the native keychain behaves as expected.

### Tier 2 — Data layer

**expo-sqlite — 13.2.2 → ~16.0.10 (3 majors)**

1. Versions bridged: 13.2.2 → 16.0.10.
2. Breaking affecting this repo: **none by import.** `git grep expo-sqlite` over
   tracked TS/TSX returns **zero matches**. The repo reaches SQLite only
   through WatermelonDB's `SQLiteAdapter` (`lib/database/database.ts:3`
   imports `@nozbe/watermelondb/adapters/sqlite`), so no `openDatabaseAsync`
   call and no `SQLiteProvider` React binding is used here. WatermelonDB is
   explicitly out of scope for this commit.
3. Breaking not affecting this repo: 15.0.0 removed the deprecated legacy
   `expo-sqlite` entry point and the `next` export; 14.0.0 had already moved the
   old default to `expo-sqlite/legacy`; both affect only direct importers, and
   there are none. The 15.0.0 notice moving async tasks to a dedicated parallel
   queue and the 16.0.0 SQLite 3.50.3 bump affect WatermelonDB's behaviour
   underneath us, which is worth watching on device but is not a code change
   here.
4. Verdict: **SAFE** (as a direct dependency). One flagged risk for the manual
   device pass: WatermelonDB 0.27.1 against a much newer SQLite is an
   untested combination for this repo, and the earlier review already noted the
   v1→v2 `ALTER TABLE ... DROP COLUMN` migration has never run against a real
   SQLite file.

**expo-file-system — 18.0.12 → ~19.0.24 (major, documented rewrite)**

1. Versions bridged: 18.0.12 → 19.0.24.
2. Breaking affecting this repo: **this is the highest-risk item in the batch.**
   19.0.0 made the modern `Directory`/`File` API the default and moved the old
   one to `expo-file-system/legacy`. The repo uses the **legacy** API via
   namespace import in two files — `lib/ai/models/ModelManager.ts:1` and
   `lib/ai/rag/VectorStore.ts:1` — and calls `FileSystem.documentDirectory`,
   `getInfoAsync`, `makeDirectoryAsync`, `readAsStringAsync`,
   `writeAsStringAsync`, `readDirectoryAsync`, `deleteAsync`,
   `getFreeDiskStorageAsync` and `createDownloadResumable`. 19.0.9 added
   stubs for legacy methods imported from `expo-file-system`, so these names
   survive the bump; they may log a deprecation warning and should be migrated
   to `expo-file-system/legacy` explicitly, then to the `Directory`/`File` API.
   Both files sit in the AI layer, which is already dead code at runtime
   (`ModelManager` is unreachable), so a runtime break here would not surface in
   the app today — but it is still a real source change.
3. Breaking not affecting this repo: `Paths.cache` / `Paths.document` becoming
   experience-isolated in Expo Go (19.0.23) and the Android path-traversal fix
   (19.0.23) only affect the new API and Expo Go.
4. Verdict: **REQUIRES_CODE_CHANGE_LOGGED** — migrate both imports to
   `expo-file-system/legacy` to preserve behaviour and silence the deprecation,
   tracked in `docs/followups.md`. Migration to the modern API is a separate
   task.

> **Duplicate resolution:** `expo-doctor` reported a duplicate native module —
> `expo-file-system@18.0.12` direct vs `19.0.21` nested under `expo`. Aligning
> the direct dependency to `~19.0.24` should collapse these to a single copy.
> To be confirmed after `--fix`; recorded here rather than in followups.

### Tier 3 — Crypto

**expo-crypto — 14.0.2 → ~15.0.9 (major)**

1. Versions bridged: 14.0.2 → 15.0.9.
2. Breaking affecting this repo: none.
3. Breaking not affecting this repo: 15.0.9 reads `crypto` off `globalThis`
   rather than only `window.crypto` (web only). Across 14.0.0 → 15.0.9 there is
   **no change to `digestStringAsync`, no change to
   `CryptoDigestAlgorithm.SHA256`, and no change to the digest output encoding.**
   The 9.0.0 hex/base64 newline change predates the installed version by years.
4. Verdict: **SAFE**, and explicitly: **device IDs will NOT regenerate.** The
   algorithm contract is unchanged, so existing `hv_device_id` values and the
   `users.device_id` rows keyed off them stay valid. No user data orphans.

### Tier 4 — Config surface

**expo-splash-screen — 0.27.7 → ~31.0.13 (version reset)**

1. Versions bridged: 0.27.7 → 31.0.13.
2. Breaking affecting this repo: none found. `app.json` has **no
   `expo-splash-screen` plugin entry** — the `plugins` array contains only
   `expo-router` (with an `origin` option) and `expo-font`. Splash
   configuration lives in the legacy top-level `expo.splash` object
   (`app.json:11-15`: `image`, `resizeMode`, `backgroundColor`), and
   `app/_layout.tsx:9,20,35-37` uses only `preventAutoHideAsync` and
   `hideAsync`.
3. Breaking not affecting this repo: 0.27 → 31 is a versioning reset to match
   the unified Expo package versioning introduced in SDK 51, not a 30-major
   jump. The modern plugin form (`backgroundColor` / `imageWidth`) replaces the
   legacy `splash` object, but since this repo never adopted the plugin, nothing
   in it needs to change — the legacy keys are still read.
4. Verdict: **SAFE**. Adopting the plugin is optional future work, noted in
   followups.

**expo-system-ui — 3.0.7 → ~6.0.9 (major)**

1. Versions bridged: 3.0.7 → 6.0.9.
2. Breaking affecting this repo: none. `git grep expo-system-ui` matches only
   `package.json` and `pnpm-lock.yaml` — the repo declares the dependency but
   **never imports it**. `setBackgroundColorAsync` and `userInterfaceStyle`
   migration are therefore moot; `userInterfaceStyle: "dark"` is set in
   `app.json:8` and read from config, not from this module.
3. Breaking not affecting this repo: all API changes — the module is unused.
4. Verdict: **SAFE**. Worth flagging in followups that this is a declared but
   dead dependency.

**expo-status-bar — 1.12.1 → ~3.0.9 (major)**

1. Versions bridged: 1.12.1 → 3.0.9.
2. Breaking affecting this repo: none. `git grep expo-status-bar` over tracked
   TS/TSX returns **zero matches** — the module is declared but never imported,
   so no `style` / `translucent` prop usage exists to migrate.
3. Breaking not affecting this repo: all changes — module unused.
4. Verdict: **SAFE**.

**expo-web-browser — 13.0.3 → ~15.0.11 (major)**

1. Versions bridged: 13.0.3 → 15.0.11.
2. Breaking affecting this repo: none. `git grep expo-web-browser` over tracked
   TS/TSX returns **zero matches** — declared but never imported, so no
   `openBrowserAsync` result shape to reconcile.
3. Breaking not affecting this repo: all changes — module unused.
4. Verdict: **SAFE**.

## Verdict summary

| Tier | Package | Bump | Verdict |
| :-- | :-- | :-- | :-- |
| 1 | `expo-local-authentication` | 14.0.1 → 17.0.9 | SAFE |
| 1 | `expo-secure-store` | 12.8.1 → 15.0.8 | SAFE |
| 2 | `expo-sqlite` | 13.2.2 → 16.0.10 | SAFE (unused directly) |
| 2 | `expo-file-system` | 18.0.12 → 19.0.24 | **REQUIRES_CONFIG_CHANGE_LOGGED** |
| 3 | `expo-crypto` | 14.0.2 → 15.0.9 | SAFE |
| 4 | `expo-splash-screen` | 0.27.7 → 31.0.13 | SAFE |
| 4 | `expo-system-ui` | 3.0.7 → 6.0.9 | SAFE |
| 4 | `expo-status-bar` | 1.12.1 → 3.0.9 | SAFE |
| 4 | `expo-web-browser` | 13.0.3 → 15.0.11 | SAFE |

Eight SAFE, one REQUIRES_CONFIG_CHANGE_LOGGED (`expo-file-system` legacy import
migration). No package in this batch is REQUIRES_CODE_CHANGE_IN_THIS_COMMIT.

The four Tier 4 packages and `expo-sqlite` are **declared but never imported**,
which is why their majors are low risk here. That is a pre-existing dependency
hygiene problem, not something this alignment introduces.

### Positive findings

**`react-native-reanimated` — already compliant, untouched.** Installed `4.1.7`
against `package.json`'s `~4.1.1`, and **absent from `expo install --check`**,
i.e. it already satisfied SDK 54's expected range. Absence from the list is the
only signal available — the check does not report compliant packages — so this
was confirmed independently rather than assumed. Not bumped.

**Duplicate `expo-file-system` resolved by alignment.** `expo-doctor` had
reported the native module present twice: `18.0.12` direct and `19.0.21`
nested under `expo`. Aligning the direct dependency to `~19.0.24` collapsed
these to a single copy. Resolved by the bump; nothing else was changed to
achieve it.

## Known warnings not fixed in this commit

**WatermelonDB `LokiJSAdapter {useIncrementalIndexedDB: false}` deprecation.**
The Jest adapter mock (`jest.setup.js:166`) passes this option and has since it
was written; WatermelonDB 0.27.1 emits a warning twice per test run.

It was tried and reverted: the option is **mandatory**, not merely deprecated.
Omitting it throws `LokiJSAdapter \`useIncrementalIndexedDB\` option is
required` at adapter construction and fails both database suites (184/210
passing). The two legal states are `true` (new IndexedDB persistence) or
`false` (previous behaviour, warning suppressed). `false` is required here to
keep the mock synchronous for Jest. Silencing the warning therefore means
changing persistence semantics and re-validating the database suites, which
trades a cosmetic warning for real regression risk. Tracked in
`docs/followups.md`.

## Outstanding manual verification

**Step 6 (cold-start verification) now requires a three-case pass.** With ADR-0005
(`e7665bd`, "fix(auth): re-derive dbId on cold start so domain data survives restart"),
the check is not removed but changed: what the manual pass looks for depends on what the
stored profile carries. The manual pass on a real device must verify all three cases:

1. Cold start with a stored profile that carries `dbId` (normal path). Expect: biometric
   prompt, then dashboard with the user's data.
2. Cold start with a stored profile that has no `dbId` but a `users` row exists for
   `deviceId` (repair path — the e7665bd fix). Expect: biometric prompt, `resolveDbId`
   re-derives, dashboard shows data. This path has a unit test but has never run against a
   real SecureStore + SQLite.
3. Cold start with no matching `users` row (fresh install or restored DB). Expect:
   dashboard is empty. This is the limitation, not a design choice — see 2b.

Nothing below has otherwise been executed on a real device or simulator: the automated suite
mocks `expo-local-authentication` and `expo-secure-store` and therefore proves neither the
real biometric prompt nor the real keychain round-trip.

Run on a simulator or device:

1. Build a development client — the app needs native modules Expo Go does not
   bundle: `npx expo prebuild --platform ios && npx expo run:ios` (or the
   Android equivalent).
2. Launch the app, complete the setup flow (name → Get Started), and confirm you
   land on `(tabs)`.
3. Open Settings → Security, enable **App Lock** and **Biometric**; confirm both
   toggles stay on.
4. **Kill the app completely** (swipe it out of the app switcher or `adb shell
   am force-stop <package>`) — do not merely background it.
5. Relaunch. The unlock prompt MUST appear before `(tabs)`. Cancel it and
   confirm you stay locked out with a retry button and no path into the tabs.
6. Pass the prompt and confirm `(tabs)` renders with data present (case 1: profile
    carries `dbId`). For case 2 — no `dbId` but a `users` row exists for deviceId, the
    e7665bd repair path — wipe SecureStore and relaunch: expect the biometric prompt,
    `resolveDbId` re-derivation, and data present. Case 3 (fresh install or restored DB
    with no matching row) must yield an empty dashboard.
7. Add a temporary `console.log` inside `partialize` in `lib/stores/authStore.ts`,
   log the emitted payload, and confirm `isAuthenticated` is **absent** while
   `hasAccount` / `userId` / `deviceId` / `lastAuthTimestamp` are present.
   Remove the log.
8. With app lock still on, clear app storage / AsyncStorage and relaunch. The app
   must land on the **setup** screen, not `(tabs)`.
9. Background the app for **under 5 minutes** and return: it must stay unlocked.
10. Background it for **over 5 minutes** and return: it must re-lock and require
    a fresh unlock.
11. Re-enable app lock, then remove the enrolled biometric from the device's
    system settings and relaunch. The app must **fail closed** with the
    "Biometrics unavailable" message — it must not let you in.
12. Settings → Security → "Delete all data": confirm a biometric prompt appears
    before the wipe, and that cancelling leaves the data intact.

Steps 9–12 have no automated coverage at all. Steps 1–8 exercise the behaviour
the mocked tests assert, so a failure there would indicate the mock and the real
API disagree — that is the specific risk this alignment was meant to retire.

13. **Verify the Face ID consent string actually landed.** The
    `expo-secure-store` plugin only takes effect at prebuild time, so the
    `NSFaceIDUsageDescription` key does not exist until step 1 runs. After the
    first native build, confirm the key is present with the expected value —
    on iOS via Xcode target settings → Info, or:
    `npx expo config --type prebuild` / inspect the generated `ios/*/Info.plist`.
    Then confirm the Face ID prompt shows the intended purpose string. A missing
    key means `authenticateAsync` fails silently on device even though every test
    passes.
14. Re-run steps 4–6 **after** the native build specifically, since the prebuild
    is what introduces the new native module wiring for `expo-secure-store` and
    `expo-local-authentication` at their new majors.
15. Exercise the AI model-download path (Settings → AI) to confirm the
    `expo-file-system/legacy` import migration works on real hardware — cache
    directory creation, model write, and cache read-back. The mock cannot
    exercise a native module, and this path is currently unreachable from the UI.
