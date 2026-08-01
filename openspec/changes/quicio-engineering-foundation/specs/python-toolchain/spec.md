# Spec: python-toolchain

## Purpose

Define the Python language module of Quicio Foundry. The module is
the only place that knows concrete details for Python: package
manager, formatter, type checker, test runner, and how the four
abstract commands map to concrete tasks declared under
`[tool.taskipy.tasks]`. A generated Python project MUST pass `uv
sync` followed by `uv run task check && uv run task test && uv run
task build && uv run task format-check` from a clean shell.

Taskipy does not guarantee forwarding of extra CLI arguments to the
underlying command, so the check mode of `format` SHALL be invoked
as its own task (`format-check`) and never as `task format --check`.

## ADDED Requirements

### Requirement: Language module metadata

The Python language module SHALL declare the following fields:

- `id: 'python'`
- `packageManager: 'uv'`
- `python: '>=3.12'`
- `commands.check`, `commands.test`, `commands.build`: strings that
  resolve to `task <name>` invocations.
- `commands.format.write` (`task format`) and
  `commands.format.check` (`task format-check`): the two modes of
  the single abstract `format` command. There is no fifth abstract
  command.

#### Scenario: language module declares the documented metadata

- **WHEN** the Python language module is inspected
- **THEN** it SHALL expose the fields listed above, and its abstract
  command names SHALL be exactly `check`, `test`, `build`, `format`.

### Requirement: Task definitions in pyproject.toml

Every generated `pyproject.toml` for Python SHALL declare a
`[tool.taskipy.tasks]` section with the following tasks:

- `check`: `ruff check . && basedpyright src`
- `test`: `pytest`
- `build`: `buildKind`-dependent (see scenarios below)
- `format`: `ruff format .` (the `format` write mode)
- `format-check`: `ruff format --check .` (the `format` check mode)

`format-check` is a concrete taskipy task name, not an abstract
command. The module SHALL resolve its `build` task from the
`buildKind` value supplied by `composition` and SHALL NOT read
`Profile.id`.

#### Scenario: buildKind distributable has a real build

- **WHEN** the supplied `buildKind` is `distributable`
- **THEN** `tasks.build` SHALL run `uv build` and SHALL produce a
  wheel in `dist/`.

#### Scenario: buildKind none has a no-op build

- **WHEN** the supplied `buildKind` is `none`
- **THEN** `tasks.build` SHALL succeed without producing artifacts
  (e.g. `echo "no-op build"` via the shell task).

#### Scenario: module never branches on profile id

- **WHEN** the Python language module's source is inspected
- **THEN** it SHALL NOT reference the string `library`,
  `application`, or `experiment`.

### Requirement: Taskipy is declared as a development dependency

Because `uv run task <name>` only resolves when taskipy is installed
in the project environment, every generated `pyproject.toml` SHALL
declare `taskipy` as a development dependency.

#### Scenario: task runner resolves after uv sync

- **WHEN** `uv sync` completes in a generated Python project
- **THEN** `uv run task check` SHALL resolve the task runner and
  SHALL NOT fail with an unresolved `task` executable.

### Requirement: Workspace integrity

A generated Python project MUST pass the verification contract from
a clean shell after a single `uv sync`.

#### Scenario: experiment + python passes the contract

- **WHEN** `uv sync && uv run task check && uv run task test &&
  uv run task build && uv run task format-check` runs in the
  generated project
- **THEN** every step SHALL exit 0; `dist/` is not required.
