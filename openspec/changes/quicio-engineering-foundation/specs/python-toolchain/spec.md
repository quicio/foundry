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

### Requirement: Exact dependency versions

Every dependency the template declares SHALL carry an exact version
specifier (`==`). Range specifiers (`>=`, `~=`, `^`, or an unpinned
name) SHALL NOT appear in a generated `pyproject.toml`.

All pinned versions SHALL live in a single module inside the Python
language module, so that bumping the toolchain is one reviewable
diff.

#### Scenario: no range specifier is generated

- **WHEN** a generated `pyproject.toml` is parsed
- **THEN** every dependency entry SHALL use `==` with an exact
  version.

#### Scenario: versions live in one place

- **WHEN** the Python language module is inspected
- **THEN** every pinned version SHALL be declared in a single
  versions module and SHALL NOT be repeated in a template.

### Requirement: Lockfile is not shipped

The generator SHALL NOT write a `uv.lock` into the generated
project. The generated `README` SHALL instruct the user to commit the
lockfile that their first `uv sync` produces.

#### Scenario: no lockfile in the manifest

- **WHEN** the resolved manifest is inspected
- **THEN** it SHALL contain no entry whose `path` is `uv.lock`.

### Requirement: Distribution and module name derivation

Python needs two names where TypeScript needs one, and conflating
them is the most common defect in a Python generator.

- The **distribution name** written as `[project].name` SHALL be the
  validated project name unchanged. The CLI's validation already
  guarantees it is legal under PEP 503.
- The **module name**, which is the directory created under `src/`
  and the identifier the tests import, SHALL be the project name
  with every `-` and `.` replaced by `_`.

`derivePackageName(projectName)` SHALL return the distribution name.
The module name SHALL be derived by the Python module and used for
the source directory, the import in the generated test, and the
`basedpyright` target.

#### Scenario: a hyphenated project yields an importable module

- **WHEN** `quicio new my-lib --language python` runs
- **THEN** `[project].name` SHALL be `my-lib`, the source directory
  SHALL be `src/my_lib/`, and the generated test SHALL import
  `my_lib`.

#### Scenario: a dotted project name is normalised for the module

- **WHEN** the project name contains a `.`
- **THEN** the module directory SHALL replace it with `_`, so the
  module remains a single importable identifier.

#### Scenario: the generated test imports successfully

- **WHEN** `uv run task test` runs in a project generated from a
  hyphenated name
- **THEN** the import of the module SHALL resolve and the test SHALL
  pass.

### Requirement: Workspace integrity

A generated Python project MUST pass the verification contract from
a clean shell after a single `uv sync`.

#### Scenario: experiment + python passes the contract

- **WHEN** `uv sync && uv run task check && uv run task test &&
  uv run task build && uv run task format-check` runs in the
  generated project
- **THEN** every step SHALL exit 0; `dist/` is not required.
