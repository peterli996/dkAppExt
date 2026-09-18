# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

`newHybridExt` is J2 Innovations' template/scaffold for a **FIN hybrid extension**: a single pod that bundles a Fantom backend and a React/TypeScript frontend together. It is meant to be copied wholesale and renamed to bootstrap new extensions (see `newHybridExt-项目说明.md` §6 for the copy/rename checklist), so the backend and frontend code here are intentionally minimal placeholders, not a real feature.

- `fan/` — Fantom backend source (pod build via `build.fan`)
- `ts/` — standalone npm project (React 18 + TypeScript), built independently and packaged into the same pod
- `locale/` — i18n `.props` files, converted to `ts/src/localeKeys.json` at frontend build time
- `test/` — Fantom unit tests (currently placeholder only)
- `res/`, `lib/` — static resources / Axon trio files (currently placeholder only)

Two long-form Chinese docs live at the repo root:
- `newHybridExt-项目说明.md` — walkthrough of this template's structure and the steps to derive a new extension from it.
- `business-customers-实现讲解.md` — a React/state-management tutorial written against a *different* sister project's module (`smartHeating/ts/src/views/BusinessCustomers`, not present in this repo). It's kept here as a reference for the request/response and component patterns (Axon-expression calls via `client.ext.eval`, `HGrid`→JS parsing helpers, container/presentational component split) that new pages in this template are expected to follow — it does not describe code that currently exists in `ts/src`.

This directory is **not currently under git version control**; consider running `git init` before making substantial changes.

## Working mode for this repo

This is the user's practice/learning project. Unless the user explicitly asks Claude to make the change, **do not edit application code directly** — instead explain the issue and give the code snippet/diff for the user to type in themselves. This applies to `fan/`, `ts/src/`, `build.fan`, and other program code; documentation and config-only files are unaffected.

## Commands

All commands below can be run either from the repo root (forwarded via the root `package.json`) or from `ts/` directly.

```bash
# Install frontend deps (root forwards into ts/)
npm run install     # npm i --ignore-scripts in root and ts/
npm run ci           # npm ci in ts/ (use for reproducible installs)

# Frontend dev server (defaults to port 8081)
npm start

# Frontend production build only (outputs to ts/build/)
npm run build

# Full pod build: builds ts/ first, then compiles Fantom and packages everything
# into the pod, installed directly into the FIN installation.
# Requires FIN's `fan` executable and must be run with FIN stopped.
npm run pod          # equivalent to: fan build.fan
<fin-installation-path>\bin\fan build.fan
```

Frontend-only commands (run inside `ts/`, or via `npx` from root with `--prefix ts`):

```bash
cd ts
npm run check         # tsc --noEmit — type-check only, no output
npm run lint           # eslint --ext ts,tsx,js,jsx src/
npm run format          # prettier-eslint --write on all src/**/*.{ts,tsx,js,jsx}
npm test                 # jest --passWithNoTests ./test  (no test/ dir exists yet — will pass trivially)
npm run gen-locale         # regenerate src/localeKeys.json from ../locale/en.props (also runs automatically via prebuild)
```

To run a single test file once tests exist: `npx jest path/to/file.test.ts` (jest preset is `ts-jest`, `testEnvironment: node`).

The root `pre-commit` script chains lint-staged + check + test: `cd ts && npx lint-staged && npm run check && npm run test`.

### Local dev workflow

1. Start FIN in no-auth mode: `bin\fin -noAuth`
2. `npm start` from the repo root (or `ts/`)
3. Open the dev server URL (typically `127.0.0.1:8081`) with a `projectName` hash param, since outside the FIN iframe context the page can't infer it: `127.0.0.1:8081/index.html#projectName=demo`

## Architecture

### Backend/frontend bundling (`build.fan`)

`build.fan` defines the pod (`BuildFinPod`). The field that makes this a *hybrid* extension is `nodeDirs = [`ts/`]` — the Fantom build tool builds the npm project in `ts/` first and packs `ts/build/` output into the pod. **Frontend must be built before/as part of `fan build.fan`; running the Fantom build without a fresh frontend build packages stale or missing frontend output.**

`index` in `build.fan` wires three FIN registration points that must stay in sync with class names if the extension is renamed:
- `skyarc.ext` → the `Ext` subclass (extension lifecycle entry point)
- `skyarc.lib` → the Axon function library class
- `fin.lang` → enables locale `.props` lookup under `locale/`

### Backend (`fan/`)

- `NewHybridExt.fan` — the `Ext` subclass registered as this pod's extension. `onStart`/`onStop` are lifecycle hooks (currently empty); `@ExtMeta` carries the display name/icons (icons are still placeholders in this template).
- `NewHybridLib.fan` — Axon function library. Static methods annotated `@Axon` become callable as Axon expressions from the frontend (e.g. `client.ext.eval("exampleFunc()")`). This is the primary backend↔frontend integration point: new backend capabilities are exposed as `@Axon` static functions here (or in additional Fantom classes), not as REST endpoints.

### Frontend (`ts/`)

Stack: Webpack 5 (config from `@j2inn/react-config`) + React 18 + TypeScript 4.8, MobX 6 for state, antd 6 for UI, and the `@j2inn/fin5-ui-utils` / `@j2inn/ui` / `@j2inn/utils` / `haystack-core` / `haystack-nclient` / `haystack-react` packages for talking to the FIN platform.

- Entry point: `main.tsx` mounts `<App />` into the `<app>` DOM node provided by `template.html` (which also pulls in the FIN platform bootstrap script `/finWebApp/finstack` — don't remove that).
- `App.tsx` is the top-level component; new extensions add routing/layout here.
- `store.ts` is an empty MobX store + `StoreContext` scaffold — new global state is added to this `Store` class and consumed via the context, not via prop drilling.
- `views/` holds page components (`Home.tsx` is placeholder demo content using antd's Layout/Menu/Breadcrumb).
- Non-relative imports resolve against `src/` (see `tsconfig.json` `baseUrl`/`paths` and jest's `moduleDirectories`), so `import { App } from 'App'` in `main.tsx` refers to `src/App.tsx` — prefer this style over relative `../../` paths for cross-directory imports.
- `localeKeys.json` is generated, not hand-edited — it's produced from `../locale/en.props` by `npm run gen-locale` (runs automatically in `prebuild`). Add new i18n strings to `locale/*.props` (key prefix should match the pod name, e.g. `newHybridExt.xxx`) and regenerate.

### Talking to the backend from React

The frontend does not call REST APIs; it calls Fantom `@Axon` functions via `client.ext.eval(axonExpressionString)`, which returns a haystack-core `HGrid`. The established pattern (see `business-customers-实现讲解.md` for a worked example) is:
1. A small module of `buildXxxExpr(...)` pure functions that construct the Axon expression string for each backend call (escape any user-supplied string content going into the expression).
2. Small `hvalToStr` / `hvalToNum` / `hvalToRefId`-style helpers to unwrap `HGrid`/`HVal` results into plain JS values, rather than inlining `instanceof` checks in components.
3. Container components (state, data loading, MobX/`useEffect`) kept separate from presentational components (props-only, no requests, no local business state).
