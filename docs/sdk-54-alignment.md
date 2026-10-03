# SDK 54 dependency alignment

Baseline captured by `npx expo install --check` before any change; see
`docs/sdk-54-alignment-preflight.txt` for the verbatim output.

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

### Positive finding: `react-native-reanimated`

Installed `4.1.7` against `package.json`'s `~4.1.1`, and **absent from
`expo install --check`** — i.e. it already satisfies SDK 54's expected range.
Not touched by this commit, as instructed.

## Outstanding manual verification

**Step 6 (cold-start manual verification) is OUTSTANDING.** No emulator or
device was reachable from the build environment (`adb` not on PATH; no iOS
simulator on Windows), so nothing below has been executed. The automated suite
mocks `expo-local-authentication` and `expo-secure-store` and therefore proves
neither the real biometric prompt nor the real keychain round-trip.

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
6. Pass the prompt and confirm `(tabs)` renders.
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
