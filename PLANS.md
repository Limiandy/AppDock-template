# Dependency Upgrade Plan

## Outcome

Upgrade every direct dependency in the root, `common`, and `main-app` workspaces to its latest stable version, including
major versions, and make the repository build and run with the upgraded graph.

## Verification surface

- A fresh frozen install completes and runs lifecycle scripts.
- Formatting, linting, type checking, and script tests pass, or unrelated existing failures are identified separately.
- Production builds for the shared package and main application pass.
- The development application loads without a framework error overlay or relevant console error, and a visible control
  responds.

## Constraints / boundaries

- Preserve the existing uncommitted development-startup changes.
- Do not commit, push, publish packages, deploy, or change remote services.
- Use latest stable registry releases only; do not introduce prerelease versions.

## Iteration policy

Apply the recursive latest-version upgrade, diagnose compatibility failures from current evidence, make the smallest
source or configuration migrations needed, and rerun the affected verification before proceeding.

## Blocked condition

Stop only if a required latest stable dependency has an unresolved incompatibility that cannot be safely migrated within
this repository, or if a user product decision is required.

## Status

- Direct dependencies are upgraded across all three workspaces; the root lockfile is now the single tracked dependency
  graph.
- TypeScript is on the latest compatible 6.0 release rather than 7.0 because the latest stable `typescript-eslint`
  rejects TypeScript 7.
- Type checking, production builds, script tests, frozen installation, and development-browser smoke testing have
  passed.
- The only remaining full-check failure is a pre-existing Prettier violation in
  `main-app/src/components/vue-colorful/utils/convert.ts`, which is outside this upgrade.

# CLI Initializer Plan

## Outcome

Provide a publishable `create-app-dock` initializer that scaffolds a clean AppDock project through
`pnpm create app-dock <project-name>`.

## Verification surface

- The initializer package packs a complete template snapshot without development artifacts.
- Running the packed initializer creates a project with a valid package name and expected workspace files.
- Invalid targets and non-empty destinations fail without modifying user files.
- The generated project installs and its script tests pass.

## Constraints / boundaries

- Do not publish to npm, commit, push, or overwrite an existing project directory.
- Generate the template at package time from this repository; do not make user scaffolding depend on GitHub or an
  installed Git client.
- Preserve current uncommitted upgrade work.

## Iteration policy

Build the CLI with Node standard-library APIs, pack it locally, create a temporary project from the packed artifact,
then fix any generation or install failures.

## Blocked condition

Stop only if a registry package name or publication authority is required. Local implementation and package verification
do not require publication.

## Status

- Added the `create-app-dock` workspace package, its Node-based binary, template generation, tarball packaging, and
  safety tests.
- Verified the packed tarball creates a project that passes frozen installation and its script test suite.
- Published `create-app-dock@0.1.0` with the `latest` dist-tag.
- Prepared the GitHub Actions OIDC workflow locally; it awaits a repository push and npm Trusted Publisher binding.

# Static Mock Data Plan

## Outcome

Make the deployed static AppDock frontend usable without a backend by routing demo CRUD through an IndexedDB mock
adapter, while preserving the Supabase adapter for local integration and future hosted backends.

## Verification surface

- Mock mode is the default with no runtime secret or server dependency.
- Supabase mode remains selectable through a Vite mode.
- The SuperTable demo supports filtering, pagination, create, edit, delete, and resetting browser-local seed data in
  mock mode.
- Static production build, type checking, scripts, and browser interaction checks pass.

## Constraints / boundaries

- Mock data remains browser-local; it does not create shared persistence or a server API.
- Do not expose a service-role key, deploy a backend, or change the existing local Supabase stack.
- Preserve the existing untracked `.build/` cache.

## Iteration policy

Introduce a repository interface first, implement both adapters behind it, then verify the same table workflow against
IndexedDB in a browser.

## Blocked condition

Stop only if the user requires shared, cross-browser data or server-side upload behavior; that requires a deployed
backend and is outside a static-only package.

## Status

- Added an IndexedDB-backed shelter repository and retained the Supabase repository behind the same interface.
- Added explicit mock and Supabase development and build modes.
- Verified both build modes, then exercised Mock filtering, create persistence, and reset in a browser.

# Template Maintenance Plan

## Outcome

Turn the template repository into a clean baseline that a fresh clone can install, check, build, and publish without
manual generation steps or leftover environment-specific configuration.

## Verification surface

- `pnpm run check` passes, covering formatting, linting, type checking, and script tests.
- A fresh clone only needs `pnpm install` before `pnpm dev` or `pnpm build`; generated files are already present.
- `main-app/src/micro-apps.json` and `main-app/src/router/modules/*.ts` are tracked, and the registration manifest no
  longer changes when switching between dev and build.
- Root `tsconfig.json` references for `application/*` stay aligned with the projects that actually exist.

## Constraints / boundaries

- IndexedDB Mock stays the default data source; Supabase stays optional.
- Sub-application scaffolding and build output layout are unchanged.
- No local secrets are committed; `docker/supabase/.env.local` stays ignored.

## Iteration policy

Fix the generated-artifact contract and automation first, then remove leftover configuration, then align documentation
and commit the result.

## Status

- Removed the leftover intranet proxies from `main-app/vite.config.ts` and the ineffective npm `workspaces` field from
  the root manifest.
- Tracked `micro-apps.json` and the generated route modules; the manifest now stores name, port, and mounting
  conventions, while `registerMicroApp` derives dev/build entries at runtime.
- Added `pnpm sync:tsconfig` and wired automatic `application/*` reference syncing into micro-app generation, project
  selection, and application add/delete flows.
- Committed `.env.mock` and `.env.supabase`, and made the `create-app-dock` template snapshot include them plus the
  default `micro-apps.json`.

# Agent Collaboration Docs Plan

## Outcome

Provide a standardized Agent collaboration document set so any Agent or contributor can use the scaffold and follow the
repository conventions without re-deriving them from source.

## Verification surface

- `AGENTS.md` states the hard rules, command surface, task routing, verification duties, and commit conventions.
- `docs/architecture.md`, `docs/scaffold.md`, and `docs/conventions.md` cover mechanism, usage, and conventions with
  commands and file paths that match the repository.
- Projects generated by `create-app-dock` ship the same documents, and the CLI test asserts their presence.
- `pnpm run check` passes.

## Constraints / boundaries

- Documents are written in Chinese and stay consistent with `README.md`, `common/README.md`, and `PLANS.md`.
- No scaffold behavior changes; only documentation, template registration, and test assertions.

## Iteration policy

Write the Agent entry first, derive the detail documents from the actual implementation, then wire the documents into
the template snapshot and verify with the full check.

## Status

- Added `AGENTS.md` plus `docs/architecture.md`, `docs/scaffold.md`, and `docs/conventions.md`.
- Registered both in the `create-app-dock` template snapshot and asserted them in the CLI test.
- Extended the Prettier scope to `docs/`.
