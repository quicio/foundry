# Spec: generated-project-verification

## Purpose

Define the verification contract that every generated project must
satisfy. Verification is the only objective signal that a generated
project is correct. It is run by the CLI after generation
(unless `--no-verify` is supplied) and is also run as a standalone
sub-command internally for testing.

## ADDED Requirements

### Requirement: Verification result type

The system SHALL expose a `verify(projectRoot, language)` function
that returns an aggregated result of the shape:

- `ok: boolean`
- `steps: { name, ok, stderr? }[]`

where `name` is one of `check`, `test`, `build`, `format:check`.

#### Scenario: result aggregates every step

- **WHEN** `verify` returns
- **THEN** `steps` SHALL contain exactly four entries, in the fixed
  order `check`, `test`, `build`, `format:check`.

### Requirement: Fixed step order

The four steps SHALL be executed in the fixed order
`check`, `test`, `build`, `format:check`.

#### Scenario: steps run in fixed order

- **WHEN** `verify` is called
- **THEN** the recorded `steps` array SHALL be in the order above
  regardless of which step fails first.

### Requirement: Short-circuit on failure

If any step exits non-zero, `verify` SHALL stop running subsequent
steps, SHALL record the failing step's `stderr`, and SHALL set
`ok=false`.

#### Scenario: failing check short-circuits

- **WHEN** the `check` step exits non-zero
- **THEN** `verify` SHALL NOT run `test`, `build`, or
  `format:check`, and the result SHALL have `ok=false` with the
  failing step's `stderr` preserved.

### Requirement: Friendly missing-tool errors

When a required tool is missing on `PATH` (e.g. `pnpm` not
installed), `verify` SHALL record `ok=false` and SHALL name the
missing tool in the failing step's `stderr`, not a raw
command-not-found stack trace.

#### Scenario: missing pnpm

- **WHEN** `pnpm` is not on `PATH` and `verify` runs the check
  step for a TypeScript project
- **THEN** the failing step's `stderr` SHALL contain the string
  `pnpm` and SHALL NOT contain a raw `Error: spawn pnpm ENOENT`
  stack.

### Requirement: No destructive cleanup on failure

When `verify` fails on a generated project, `verify` SHALL NOT
delete or modify any file in the project root.

#### Scenario: failed verify preserves partial work

- **WHEN** `verify` returns `ok=false`
- **THEN** the project root on disk SHALL be byte-identical to its
  state immediately after the generator wrote its files (modulo
  any tool-side artifacts the verification steps themselves may
  have created, such as `node_modules` or `.venv`).
