# Spec: python-toolchain

## Purpose

Define the Python language module of Quicio Foundry. The module is
the only place that knows concrete details for Python: package
manager, formatter, type checker, test runner, and how the four
abstract commands map to concrete tasks declared under
`[tool.taskipy.tasks]`. A generated Python project MUST pass `uv
sync` followed by `uv run task check && uv run task test && uv run
task build && uv run task format --check` from a clean shell.

## ADDED Requirements

### Requirement: Language module metadata

The Python language module SHALL declare the following fields:

- `id: 'python'`
- `packageManager: 'uv'`
- `python: '>=3.12'`
- `commands.check`, `commands.test`, `commands.build`,
  `commands.format`, `commands.format:check`: strings that resolve
  to `task <name>` invocations.

#### Scenario: language module declares the documented metadata

- **WHEN** the Python language module is inspected
- **THEN** it SHALL expose exactly the fields listed above.

### Requirement: Task definitions in pyproject.toml

Every generated `pyproject.toml` for Python SHALL declare a
`[tool.taskipy.tasks]` section with the following tasks:

- `check`: `ruff check . && basedpyright src`
- `test`: `pytest`
- `build`: profile-dependent (see scenario below)
- `format`: `ruff format .`
- `format-check`: `ruff format --check .`

#### Scenario: library profile has a real build

- **WHEN** the resolved profile is `library`
- **THEN** `tasks.build` SHALL run `uv build` and SHALL produce a
  wheel in `dist/`.

#### Scenario: experiment profile has a no-op build

- **WHEN** the resolved profile is `experiment`
- **THEN** `tasks.build` SHALL succeed without producing artifacts
  (e.g. `echo "no-op build"` via the shell task).

### Requirement: Workspace integrity

A generated Python project MUST pass the verification contract from
a clean shell after a single `uv sync`.

#### Scenario: experiment + python passes the contract

- **WHEN** `uv sync && uv run task check && uv run task test &&
  uv run task build && uv run task format --check` runs in the
  generated project
- **THEN** every step SHALL exit 0; `dist/` is not required.
