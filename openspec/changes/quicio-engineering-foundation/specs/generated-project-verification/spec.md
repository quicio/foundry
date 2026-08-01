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

where `name` is one of the four abstract command names `check`,
`test`, `build`, `format`. The `format` step SHALL be executed in
`check` mode; the concrete script or task the language module maps
that mode to (`format:check`, `format-check`, or another name) SHALL
NOT leak into `steps[].name`.

#### Scenario: result aggregates every step

- **WHEN** `verify` returns
- **THEN** `steps` SHALL contain exactly four entries, in the fixed
  order `check`, `test`, `build`, `format`.

#### Scenario: step names carry no concrete script name

- **WHEN** `steps` is inspected for a TypeScript project whose
  concrete check-mode script is `format:check`
- **THEN** the fourth entry's `name` SHALL be `format`.

### Requirement: Fixed step order

The four steps SHALL be executed in the fixed order
`check`, `test`, `build`, `format`.

#### Scenario: steps run in fixed order

- **WHEN** `verify` is called
- **THEN** the recorded `steps` array SHALL be in the order above
  regardless of which step fails first.

### Requirement: Format step runs in check mode

The `format` step SHALL invoke the language module's `format` check
mode and SHALL NOT invoke its write mode. Verification SHALL NOT
reformat the generated project.

#### Scenario: verify does not rewrite source files

- **WHEN** `verify` completes with `ok=true` on a generated project
- **THEN** every file written by the generator SHALL be
  byte-identical to its state before `verify` ran.

### Requirement: Short-circuit on failure

If any step exits non-zero, `verify` SHALL stop running subsequent
steps, SHALL record the failing step's `stderr`, and SHALL set
`ok=false`.

#### Scenario: failing check short-circuits

- **WHEN** the `check` step exits non-zero
- **THEN** `verify` SHALL NOT run `test`, `build`, or `format`, and
  the result SHALL have `ok=false` with the failing step's `stderr`
  preserved.

### Requirement: Top-level ok aggregates every step

The result's top-level `ok` SHALL be `true` if and only if every
recorded step has `ok: true`. A `verify` run with no recorded steps
SHALL return `ok: false`.

#### Scenario: ok is the conjunction of every step

- **WHEN** `verify` returns
- **THEN** the top-level `ok` SHALL equal
  `steps.every(step => step.ok)`.

#### Scenario: short-circuited ok reflects the failing step

- **WHEN** `verify` short-circuits on a failing step
- **THEN** the top-level `ok` SHALL be `false` and the recorded
  `steps` array SHALL contain only the steps that ran, in order.

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
