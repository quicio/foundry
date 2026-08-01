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
- `commands.check`, `commands.test`, `commands.build`: strings that
  resolve to the documented scripts in the generated `package.json`.
- `commands.format.write` and `commands.format.check`: the two modes
  of the single abstract `format` command. There is no fifth
  abstract command.

#### Scenario: language module declares the documented metadata

- **WHEN** the TypeScript language module is inspected
- **THEN** it SHALL expose the fields listed above, and its abstract
  command names SHALL be exactly `check`, `test`, `build`, `format`.

### Requirement: Concrete scripts in package.json

Every generated `package.json` for TypeScript SHALL define the
following `scripts`:

- `check`: `biome check . && tsc --noEmit`
- `test`: `vitest run`
- `build`: `buildKind`-dependent (see scenarios below)
- `format`: `biome format --write .` (the `format` write mode)
- `format:check`: `biome format .` (the `format` check mode)

`format:check` is a concrete `package.json` script name, not an
abstract command. The module SHALL resolve its `build` script from
the `buildKind` value supplied by `composition` and SHALL NOT read
`Profile.id`.

#### Scenario: buildKind distributable has a real build

- **WHEN** the supplied `buildKind` is `distributable`
- **THEN** `scripts.build` SHALL be `tsup` (or an equivalent that
  produces `dist/`).

#### Scenario: buildKind none has a no-op build

- **WHEN** the supplied `buildKind` is `none`
- **THEN** `scripts.build` SHALL succeed without producing artifacts
  and SHALL be `echo "no-op build"`.

#### Scenario: module never branches on profile id

- **WHEN** the TypeScript language module's source is inspected
- **THEN** it SHALL NOT reference the string `library`,
  `application`, or `experiment`.

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
