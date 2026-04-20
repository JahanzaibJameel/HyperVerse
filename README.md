# HyperVerse

HyperVerse is a cross-platform Expo application that packages a cyberpunk-style "life operating system" into a single experience. The app combines health, finance, social, AI, AR, IoT, and blockchain surfaces behind a shared gamified identity layer, with a custom static build pipeline for Expo Go style deployment.

This repo snapshot is best understood as a polished product prototype or front-end vertical slice. The UX is rich, the navigation is real, and the deployment tooling is non-trivial, but most domain data is currently mocked in-app rather than backed by live services.

## Highlights

- Multi-tab app shell built with Expo Router and React Native, targeting iOS, Android, and web.
- Shared app state through `AppContext`, including profile progression, health stats, finance stats, and AI chat history.
- High-fidelity UI system with custom cards, charts, progress rings, blur effects, haptics, and themed neon visuals.
- Custom Node-based build pipeline that generates static bundles, rewrites asset URLs, and serves Expo manifests for platform-specific clients.
- Strict TypeScript setup with path aliases and typed Expo routes enabled.

## Product Areas

- `Home`: unified dashboard for progression, streaks, live events, health snapshots, finance summaries, and AI prompts.
- `Health`: biometric rings, sleep analysis, workouts, achievements, and XP-based actions.
- `Finance`: net worth dashboard, trends, goals, budget signals, and AI finance insights.
- `Social`: live feed, rooms, online presence, and lightweight post creation.
- `AR`: spatial overlay concepts, scanning, gesture interactions, and time-travel themed UI.
- `AI`: chat surface, memory view, and virtual twin summaries.
- `IoT`: smart-home devices, automation controls, MQTT-style event stream, and environment telemetry.
- `Blockchain`: wallet, staking, NFT progression, marketplace, and identity overlays.

## Stack

- Expo 54
- React Native 0.81
- React 19
- Expo Router 6
- TypeScript with `strict: true`
- TanStack Query
- AsyncStorage
- Reanimated, Gesture Handler, Keyboard Controller
- Expo Blur, Haptics, Image, Location, Web Browser, Symbols, and Glass Effect APIs

## Architecture

```text
app/                  Expo Router routes and tab screens
components/           Reusable UI building blocks
constants/            Theme and color tokens
context/              Shared app state and persistence
hooks/                App-level hooks
assets/               Images and static assets
scripts/build.js      Static Expo bundle/build pipeline
server/serve.js       Minimal production server for static builds
server/templates/     Landing page template used by the server
```

Important implementation notes:

- Navigation is file-based through Expo Router.
- Root providers are wired in `app/_layout.tsx`.
- App state is currently local-first and seeded from defaults in `context/AppContext.tsx`.
- User profile persistence is limited to AsyncStorage (`hv_user`).
- AI responses in the current build are mocked from in-screen prompt maps, not an external model backend.

## Getting Started

### Prerequisites

- Current Node.js LTS recommended
- `pnpm`
- Access to the workspace root that contains `pnpm-workspace.yaml`

This package is not fully standalone. It references workspace dependencies such as `@workspace/api-client-react` and a TypeScript project reference at `../../lib/api-client-react`, so dependency installation needs to happen from the monorepo root.

### Install

From the workspace root:

```bash
pnpm install
```

### Run locally

If you want the generic Expo development flow, use Expo directly:

```bash
pnpm exec expo start
```

If you are working from the workspace root, filtering by package is the safest option:

```bash
pnpm --filter @workspace/hyperverse exec expo start
```

### Typecheck

```bash
pnpm typecheck
```

## Scripts

- `pnpm dev`: Replit-oriented development command that injects domain-related environment variables before starting Expo.
- `pnpm build`: generates a static Expo build under `static-build/`, including iOS and Android bundles, copied assets, and rewritten manifests.
- `pnpm serve`: serves the generated static build and landing page through the local Node server.
- `pnpm typecheck`: runs TypeScript in no-emit mode.

## Environment Variables

The custom build and serve pipeline uses the following variables:

- `EXPO_PUBLIC_DOMAIN`: public hostname used when rewriting asset and manifest URLs.
- `REPLIT_INTERNAL_APP_DOMAIN`: preferred deployment hostname when running in Replit-like infrastructure.
- `REPLIT_DEV_DOMAIN`: fallback deployment hostname for hosted development.
- `REPL_ID`: optional ID forwarded into the Expo public env surface.
- `EXPO_PUBLIC_REPL_ID`: fallback public Replit ID.
- `BASE_PATH`: optional subpath prefix for static hosting.
- `PORT`: port for the local server, default `3000`.

For `pnpm build`, one of `REPLIT_INTERNAL_APP_DOMAIN`, `REPLIT_DEV_DOMAIN`, or `EXPO_PUBLIC_DOMAIN` must be available.

PowerShell example:

```powershell
$env:EXPO_PUBLIC_DOMAIN = "app.example.com"
pnpm build

$env:PORT = "3000"
pnpm serve
```

## Build and Deployment Notes

The static deployment flow is opinionated and worth understanding before changing it:

- `scripts/build.js` locates the workspace root, clears Metro cache, starts Metro in production mode, downloads platform bundles and manifests, copies referenced assets into `static-build/`, and rewrites URLs to the target domain.
- `server/serve.js` returns the landing page at `/`, returns iOS or Android manifests when `/` or `/manifest` is requested with the `expo-platform` header, and serves all remaining files from `static-build/`.

This is not the default Expo export flow. Treat the build script as part of the product, not a disposable helper.

## Current State

What is real:

- Navigation, theming, interactions, and component composition
- Static deployment pipeline
- Local persistence for select user state

What is still mocked:

- Most health, finance, social, AR, IoT, and blockchain data
- AI assistant behavior and responses
- External integrations, auth, and backend APIs

That split is intentional in the current codebase. If you plan to productionize this app, start by replacing screen-local mock datasets and `AppContext` defaults with real service adapters.

## Developer Notes

- `app.json` enables Expo typed routes, the React Compiler experiment, and the new architecture flag.
- The theme tokens live in `constants/colors.ts`, and most screens consume them through `useColors()`.
- The existing `pnpm dev` script is tailored to a hosted POSIX-style environment. On a normal local machine, especially on Windows, `pnpm exec expo start` is the more reliable entry point.

## Next Sensible Improvements

- Move mock domain data into typed repository/service layers.
- Replace the in-screen AI response map with a real API client.
- Add automated tests for navigation, context logic, and critical UI states.
- Document workspace-root commands in the parent monorepo if this package is meant to be onboarded independently.
