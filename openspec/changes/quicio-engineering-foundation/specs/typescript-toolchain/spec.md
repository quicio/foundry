# Spec: typescript-toolchain

## Purpose

Define the TypeScript language module of Quicio Foundry. The module
is the only place that knows concrete details for TypeScript:
package manager, runtime version, formatter, type checker, test
runner, and how the four abstract commands map to concrete scripts.
A generated TypeScript project MUST pass `pnpm install` followed by
`pnpm run check && pnpm test && pnpm run build && pnpm run
format:check` from a clean shell.

## ADDED Requirements

### Requirement: Language module metadata

The TypeScript language module SHALL declare the following fields:

- `id: 'typescript'`
- `packageManager: 'pnpm'`
- `engines.node: '>=22'`
- `commands.check`, `commands.test`, `commands.build`,
  `commands.format`, `commands.format:check`: strings that resolve
  to the documented scripts in the generated `package.json`.

#### Scenario: language module declares the documented metadata

- **WHEN** the TypeScript language module is inspected
- **THEN** it SHALL expose exactly the fields listed above.

### Requirement: Concrete scripts in package.json

Every generated `package.json` for TypeScript SHALL define the
following `scripts`:

- `check`: `biome check . && tsc --noEmit`
- `test`: `vitest run`
- `build`: profile-dependent (see scenario below)
- `format`: `biome format --write .`
- `format:check`: `biome format .`

#### Scenario: library profile has a real build

- **WHEN** the resolved profile is `library`
- **THEN** `scripts.build` SHALL be `tsup` (or an equivalent that
  produces `dist/`).

#### Scenario: experiment profile has a no-op build

- **WHEN** the resolved profile is `experiment`
- **THEN** `scripts.build` SHALL succeed without producing artifacts
  and SHALL be `echo "no-op build"`.

### Requirement: Workspace integrity

A generated TypeScript project MUST pass the verification contract
from a clean shell after a single `pnpm install`.

#### Scenario: library + typescript passes the contract

- **WHEN** `pnpm install && pnpm run check && pnpm test && pnpm run
  build && pnpm run format:check` runs in the generated project
- **THEN** every step SHALL exit 0 and `dist/` SHALL exist.

#### Scenario: experiment + typescript passes the contract

- **WHEN** the same command sequence runs in a project generated
  with profile `experiment`
- **THEN** every step SHALL exit 0; `dist/` is not required.
