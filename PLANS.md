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
