---
title: Deployment
description: How to build and serve HyperVerse, what the build script does, and what is not yet available.
status: pre-release
last_verified: 2026-09-29
audience: maintainer
---

# Deployment

**`pre-release`** · verified `2026-09-29` · ~5 min read

> [!NOTE]
> This guide is referenced from the [README](../README.md) but did not exist before. The
> previous README linked to `docs/api.md` and `docs/deployment.md`; neither had ever been
> written.

## Contents

1. [What kind of build exists](#1-what-kind-of-build-exists)
2. [Prerequisites](#2-prerequisites)
3. [Running the build](#3-running-the-build)
4. [What the script does](#4-what-the-script-does)
5. [Output layout](#5-output-layout)
6. [Serving it](#6-serving-it)
7. [Web export](#7-web-export)
8. [Native builds](#8-native-builds)
9. [Release process](#9-release-process)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. What kind of build exists

There is exactly one automated build: a **static Expo Go deployment**. It produces JS bundles
and Expo manifests that an Expo Go client can load over HTTP.

> [!IMPORTANT]
> There is **no store-ready native build pipeline**. No `.ipa`, no `.aab`, and no `eas.json`.
> The app also uses native modules Expo Go does not include — WatermelonDB over SQLite,
> SecureStore, local authentication — so a device install requires a development build via
> `npx expo run:ios` / `npx expo run:android`. Producing store binaries is tracked in
> [ROADMAP Stage 4](../ROADMAP.md#stage-4--ship).

## 2. Prerequisites

- Node 20+ (CI uses Node 24)
- pnpm 9.15.0, or npm
- A reachable Metro bundler on port 8081; the script starts one if needed
- For domain-dependent behaviour: a Replit deployment, or `EXPO_PUBLIC_DOMAIN` set

## 3. Running the build

```bash
npm run build
```

Verified output on 2026-09-29:

| Artifact | Size |
| :-- | --: |
| iOS `bundle.js` | 5.04 MB |
| Android `bundle.js` | 5.05 MB |
| Assets | 49 |
| Manifests | iOS + Android |

To control the domain baked into the manifests:

```bash
EXPO_PUBLIC_DOMAIN=hyperverse.example.com npm run build
# or, on Replit, REPLIT_INTERNAL_APP_DOMAIN / REPLIT_DEV_DOMAIN are read automatically
```

With none set, the script warns and falls back to `localhost`.

## 4. What the script does

`scripts/build.js` runs in order:

1. **Resolve the domain** from `REPLIT_INTERNAL_APP_DOMAIN`, `REPLIT_DEV_DOMAIN`, or
   `EXPO_PUBLIC_DOMAIN`; falls back to `localhost`.
2. **Clear the Metro cache** — removes `.metro-cache/` and `node_modules/.cache/metro`.
3. **Start Metro** (`expo start --no-dev --minify --localhost`) unless port 8081 already
   answers, polling for up to 60 seconds.
4. **Download bundles** for iOS and Android from
   `http://localhost:8081/node_modules/expo-router/entry.bundle?platform=<p>&dev=false&minify=true`.
5. **Download Expo manifests** for both platforms.
6. **Copy assets**, rewrite `launchAsset.url` in each manifest, and write a landing page.

The script is cross-platform: it detects pnpm, npm, or yarn, and uses `spawnSync` with `shell`
enabled on Windows so it works outside bash.

## 5. Output layout

```text
static-build/
├── android/manifest.json
├── ios/manifest.json
└── <build-id>/
    ├── index.html
    └── _expo/
        ├── static/js/{ios,android}/bundle.js
        ├── static/js/node_modules/…      (assets Metro emitted)
        └── assets/…
```

`static-build/` is gitignored and excluded from ESLint, Jest, and tsconfig.

## 6. Serving it

```bash
npm run serve
```

Runs `server/serve.js` against `static-build/`. Any static file server works — the manifests
reference bundles by absolute URL, so the domain used at build time must match where the files
are served from.

## 7. Web export

The web build is separate and is what `build.yml` runs in CI:

```bash
npx expo export --platform web
```

This produces a static site in `dist/`. Verified working: 1,593 modules bundled. The web target
carries the same caveats — screens relying on native modules will degrade.

## 8. Native builds

```bash
npx expo prebuild --platform ios
npx expo run:ios
```

`prebuild` generates `ios/` and `android/`, which are **not** committed. Two consequences:

- `proguard-rules.pro` is not wired in. Copy it to `android/app/proguard-rules.pro` after
  prebuild if you want R8 obfuscation; nothing references it today.
- Minimum OS versions are not pinned. `app.json` sets no `deploymentTarget`, and there is no
  committed native project, so whatever the Expo defaults resolve to is what you get.

## 9. Release process

`.github/workflows/release.yml` triggers on tags matching `v*` and produces a GitHub release. It
does **not** build, sign, or upload a store binary.

Before tagging, run the gate:

```bash
npm run typecheck && npm test && npm run lint
```

## 10. Troubleshooting

**`Download failed: fetch failed`**

Almost always the Metro health check. `checkMetroHealth()` returns true if anything on port
8081 answers, including a dying process, so the build skips starting Metro and then cannot
reach it. Confirm the port is free and re-run:

```powershell
Invoke-WebRequest http://localhost:8081/status -UseBasicParsing -TimeoutSec 5
```

If that fails to connect, nothing is listening and the build will start its own Metro.

**`Metro timeout`**

Metro did not become healthy within 60 seconds. Run `npx expo start` manually and watch for a
bundling error, then re-run the build.

**Bundle looks stale**

The script clears the Metro cache on every run, so this usually means a client-side cache.
Clear the cache for the served domain on the device or browser.

**`No supported package manager found`**

Install pnpm, or make npm available on `PATH`.

---

**Status** `pre-release` · **verified** `2026-09-29` · [README](../README.md) ·
[Architecture](../ARCHITECTURE.md) · [Testing](TESTING.md) · [Roadmap](../ROADMAP.md)

[Edit this page](https://github.com/JahanzaibJameel/HyperVerse/blob/main/docs/DEPLOYMENT.md) ·
[Open an issue](https://github.com/JahanzaibJameel/HyperVerse/issues/new)
