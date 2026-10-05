---
title: Security Policy
description: What HyperVerse does to protect data, what it does not, and how to report a vulnerability.
status: pre-release
last_verified: 2026-10-05
audience: all
---

# Security Policy

**`pre-release`** · verified `2026-10-05` · ~6 min read

> [!IMPORTANT]
> This document previously claimed an "A+ security rating", "GDPR, CCPA compliant", "zero known
> critical vulnerabilities", AES-256 encryption at rest, a bug bounty programme, and
> third-party audits. **None of that is true.** No third-party audit has been performed and no
> compliance review has been done. This version documents the actual posture so it can be
> judged accurately.

## Contents

1. [Posture summary](#1-posture-summary)
2. [What is implemented](#2-what-is-implemented)
3. [What is not implemented](#3-what-is-not-implemented)
4. [Threat model](#4-threat-model)
5. [Reporting a vulnerability](#5-reporting-a-vulnerability)
6. [Hardening checklist](#6-hardening-checklist)

---

## 1. Posture summary

HyperVerse is a pre-release client-only app with no backend, no accounts, and no network calls.
Telemetry is possible but off by default. That is genuinely good for privacy: there is no
server to breach and nothing is transmitted unless someone deliberately enables Sentry. The
risk is almost entirely **local** — anyone with access to an unlocked device can read the data.

| Area | Status |
| :-- | :-- |
| Data in transit | Not applicable — no network requests |
| Credentials at rest | `expo-secure-store` (platform keychain / keystore) |
| Domain data at rest | Plaintext SQLite, **no encryption** |
| UI preferences at rest | Plaintext AsyncStorage |
| App lock | Implemented (`AuthService`), uses biometric APIs |
| Transport security | Not applicable |
| Certificate pinning | Not implemented |
| Log redaction | Implemented (`redact()` in `lib/logger.ts`) |
| Account deletion | Implemented — `deleteUserCascade` removes all rows |
| Dependency scanning | `dependabot.yml` plus an advisory `pnpm audit` CI job |
| Static analysis | ESLint, enforced in CI, 0 errors and 0 warnings |
| Third-party audits | None performed |

## 2. What is implemented

### Secure credential storage

`lib/storage.ts` wraps `expo-secure-store` in `safeGetItem` / `safeSetItem` / `safeDeleteItem`,
which swallow platform errors instead of crashing. The following live in the platform keychain
or keystore, not in plain files:

- `hv_user_profile` — the user profile JSON
- `hv_biometric_enabled`, `hv_app_lock_enabled` — feature flags
- the derived device ID

This is the strongest data protection in the app. It relies entirely on the OS keychain; no
application-level encryption is layered on top.

### Biometric authentication

`AuthService` implements `isBiometricAvailable()`, `authenticateWithBiometrics()`,
`enableBiometricAuth()`, `enableAppLock()`, and `authenticateForApp()` on top of
`expo-local-authentication`. 15 integration tests in `__tests__/integration/authFlow.test.tsx`
cover the success, failure, and error paths against the real service.

### Log redaction

`lib/logger.ts` exports `redact()` and `isSensitiveKey()`, applied centrally in
`createLogEntry()` so no call site can bypass it. It:

- replaces values whose key matches a credential pattern (`password`, `token`, `apiKey`,
  `authorization`, `cookie`, `dsn`, `pin`, `otp`, `cvv`, `cardNumber`, `ssn`, …) with
  `[redacted]`, matching case-insensitively so `apiKey`, `API_KEY`, and `api_key` are all caught
- truncates strings longer than 256 characters
- caps recursion at depth 4 and arrays at 50 entries
- breaks cycles instead of recursing forever
- reduces `Error` objects to `{ name, message }`, dropping the stack

Redaction applies in development as well as release builds, so a debuggable build is not a way
to leak what a release build would not. 12 tests in `__tests__/unit/logger.test.ts` cover the
behaviour, including the circular-reference and depth-cap cases.

> [!NOTE]
> This is a meaningful improvement but not a guarantee. A secret logged under a non-obvious
> key (`authHeader`, `bearer`) will not match the pattern list. Treat the list as a
> backstop, not a substitute for not logging secrets at all.

### Complete account deletion

`AuthService.deleteProfile(dbId?)` calls `deleteUserCascade` in `lib/database/database.ts`,
which destroys the `users` row and every dependent record (tasks, habits and their entries,
health metrics, finance transactions, goals, AI messages, settings) in one database write, then
clears the SecureStore profile. Logging out from the settings screen runs this path, so
"delete my data" actually deletes it rather than leaving orphaned rows behind.

### No network surface

The app contains no `fetch` to a remote host and no analytics. The only outbound-capable code
is `sentry-expo`, imported by `lib/logger.ts` inside a `try/catch`, which activates solely if
`EXPO_PUBLIC_SENTRY_DSN` is set. **It is unset, so no data leaves the device.** When it is set,
only redacted `ERROR` and `WARN` entries are sent, and only from release builds.

### Local-only data

`.env.example` previously advertised `EXPO_PUBLIC_OPENAI_API_KEY`, `EXPO_PUBLIC_ETHEREUM_RPC_URL`,
and similar variables that no code ever read. **They have been removed.** The file now documents
only `EXPO_PUBLIC_SENTRY_DSN` as the single variable that changes data flow, plus commented-out
developer-tooling entries. A template that invites a developer to paste a real API key into a
file the app ignores is a liability, not a convenience.

## 3. What is not implemented

- **No encryption of the SQLite database.** All 12 tables are plaintext.
- **No certificate pinning**, and no `expo-ssl-pinning` entry in `app.json`.
- **No Android code obfuscation.** `proguard-rules.pro` exists but is never copied into a
  generated `android/app/`, because no `android/` directory is committed.
- **No jailbreak or root detection.**
- **No screenshot protection** — no `FLAG_SECURE`, no screen-capture blocking.
- **No data export encryption.** `exportUserData()` returns plaintext JSON.
- **No `android:allowBackup="false"`** in a committed manifest, because no `android/` directory
  is committed. This matters: on Android, app data may be included in cloud backups.
- **The advisory audit now gates merges.** As of `d9b76f0` the audit job runs without
  `continue-on-error`, so a high or critical advisory outside the ignore list fails the
  pipeline. The gate is real rather than nominal: 44 GHSAs are listed in
  `package.json` under `pnpm.auditConfig.ignoreGhsas`, each measured as either absent from
  the shipped bundle on all three platforms or accepted in-bundle with a documented
  rationale (`docs/followups.md`, "Accepted advisories (ignoreGhsas)"). The step runs
  `pnpm audit` in table mode because `--json` in pnpm 9.15.0 does not apply the ignore
  list to `.metadata.vulnerabilities` or to the exit code. A clean audit emits no
  annotation; a failure emits a `::warning::` pointing back here.

## 4. Threat model

Realistic threats for an offline-first local app, in rough order of likelihood.

| Threat | Current mitigation |
| :-- | :-- |
| Someone with the unlocked device reads the data | App lock and biometrics are **opt-in**; the SQLite database is plaintext |
| A malicious app reads AsyncStorage | Depends on OS sandboxing and, on Android, app-level backup configuration |
| Lost or stolen device | Keychain-protected items are protected by the OS passcode or biometric; SQLite is not |
| Supply-chain compromise | `pnpm install --frozen-lockfile` in CI; Dependabot tracks updates; an advisory `pnpm audit` job reports vulnerabilities |
| Data exfiltration via Sentry | Only if someone sets `EXPO_PUBLIC_SENTRY_DSN`; payloads are redacted first |
| Log leakage | Payloads are redacted and truncated by `redact()`; logs are still readable via `adb logcat` on a debuggable build |
| Orphaned user data after deletion | Closed — `deleteUserCascade` removes all dependent rows |

## 5. Reporting a vulnerability

There is no security contact address configured for this project, and no published PGP key. The
previous version of this file listed `security@hyperverse.app`; that address is not associated
with this repository.

Until a real channel exists, report through **GitHub's private vulnerability reporting** on the
repository, which is enabled by default on GitHub repositories. If that is unavailable, open a
regular issue describing the issue **without** exploit details or real user data.

Please do not open a public issue containing a working exploit for an unfixed vulnerability.

**What to include:** affected version or commit, reproduction steps, impact assessment, and
whether user data is exposed.

> [!WARNING]
> No response time is committed to, because there is no security team. Treat this as a
> best-effort channel. The project has a single maintainer.

## 6. Hardening checklist

Done since the previous revision:

- [x] Drop the `is_encrypted` column (schema v2) rather than leave it implying encryption
- [x] Redact user data in `lib/logger.ts`
- [x] Implement `deleteProfile()` so it removes database rows, not just the SecureStore entry
- [x] Add an advisory `pnpm audit` job to CI
- [x] Remove the `EXPO_PUBLIC_OPENAI_API_KEY` and RPC entries from `.env.example`
- [x] Add `typecheck` and check-only `lint` to CI so a regression cannot merge

Still open, ordered by value:

- [ ] Encrypt the SQLite database
- [ ] Make app lock mandatory on first launch rather than opt-in
- [ ] Add `android:allowBackup="false"` to the generated Android manifest
- [ ] Add a threat-model exercise or external review; the table above is self-assessed
- [ ] Decide whether to keep `sentry-expo`; if kept, document the telemetry it introduces
- [ ] Document the minimum supported iOS and Android versions; `app.json` sets neither, and no
      native project is committed
- [ ] Consider making the dependency audit blocking once the advisory count reaches zero

---

**Status** `pre-release` · **verified** `2026-09-29` · [README](README.md) ·
[Architecture §8](ARCHITECTURE.md#8-storage-boundaries) ·
[Technical debt](ROADMAP_V2.md)

[Edit this page](https://github.com/JahanzaibJameel/HyperVerse/blob/main/SECURITY.md) ·
[Open an issue](https://github.com/JahanzaibJameel/HyperVerse/issues/new)
