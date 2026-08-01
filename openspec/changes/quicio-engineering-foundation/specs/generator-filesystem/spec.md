# Spec: generator-filesystem

## Purpose

Define `internal/fs`, the only module allowed to touch the disk. It
turns a resolved `Manifest` into files, and it is where the
generator's two safety guarantees live: the generator never writes
outside the target directory, and it never overwrites an existing
file.

`design.md` declared both guarantees as security properties but
attached no requirement and no test to either. A control with no
scenario is an intention. This capability makes them verifiable.

## ADDED Requirements

### Requirement: Writes are confined to the target directory

`internal/fs` SHALL reject any manifest entry whose `path` is
absolute, contains a `..` segment, or resolves outside the target
directory. Rejection SHALL happen before any file is written.

#### Scenario: absolute path is rejected

- **WHEN** an entry's `path` is `/etc/passwd`
- **THEN** the write SHALL fail with exit code 3, naming the entry,
  and no file SHALL be created anywhere.

#### Scenario: traversal path is rejected

- **WHEN** an entry's `path` is `../outside/file.txt`
- **THEN** the write SHALL fail with exit code 3 and no file SHALL
  be created anywhere.

#### Scenario: validation precedes all writes

- **WHEN** a manifest contains ten valid entries followed by one
  escaping entry
- **THEN** the write SHALL fail with exit code 3 and none of the ten
  valid entries SHALL have been written.

### Requirement: Symlinked path components do not grant escape

`internal/fs` SHALL resolve each path component before writing. If
any component is a symlink whose target lies outside the target
directory, the write SHALL fail.

#### Scenario: a symlinked directory pointing outside is refused

- **WHEN** the target directory contains a symlink `sub` pointing to
  a directory outside the target, and an entry's `path` is
  `sub/file.txt`
- **THEN** the write SHALL fail with exit code 3 and the file SHALL
  NOT be created at the symlink's destination.

### Requirement: Never overwrite an existing file

`internal/fs` SHALL refuse to write to a path that already exists,
regardless of any CLI flag, and SHALL NOT delete any pre-existing
file.

#### Scenario: existing file blocks the write

- **WHEN** an entry's `path` already exists on disk
- **THEN** the write SHALL fail with exit code 3, name the colliding
  path, and leave that file byte-identical.

### Requirement: Per-file atomic writes

Each file SHALL be written atomically: content is written to a
temporary file in the destination directory and then renamed into
place. A crash SHALL leave either the complete file or no file, never
a truncated one.

#### Scenario: interrupted write leaves no partial file

- **WHEN** the process is killed after the temporary file is written
  but before the rename
- **THEN** the destination path SHALL NOT exist and no truncated
  file SHALL remain at that path.

### Requirement: No transaction across files

Atomicity is per file, not per run. `internal/fs` SHALL NOT attempt
to roll back files already written when a later entry fails, and
SHALL NOT delete them. A failed run therefore may leave a partial
project on disk.

This is a deliberate trade: the user keeps partial work and can
inspect it, which matches the same decision already taken for failed
verification. The CLI's error message SHALL state that the target
directory was left in a partial state.

#### Scenario: a mid-run failure preserves earlier files

- **WHEN** the fifth of ten entries fails to write for an
  unforeseeable reason such as a full disk
- **THEN** the four already-written files SHALL remain on disk
  unchanged, and the error message SHALL state that the target
  directory is partial.

### Requirement: Dry run touches nothing

When the run is a dry run, `internal/fs` SHALL perform every
validation described above and SHALL create no file, no directory,
and no temporary file.

#### Scenario: dry run over an escaping entry still fails

- **WHEN** a dry run's manifest contains an escaping entry
- **THEN** it SHALL fail with exit code 3, so that `--dry-run`
  reports the same refusal a real run would.

#### Scenario: dry run creates nothing

- **WHEN** a dry run completes over a valid manifest
- **THEN** the target directory SHALL be byte-identical to its state
  before the run.

### Requirement: Text files only in v0

`internal/fs` SHALL write UTF-8 text files with mode `0644` and
SHALL create intermediate directories with mode `0755`. Binary
content and the executable bit are out of scope for v0. A layer that
needs either SHALL surface a blocker rather than encode content in a
string.

#### Scenario: generated files are not executable

- **WHEN** any file written by the generator is inspected
- **THEN** its mode SHALL be `0644`.
