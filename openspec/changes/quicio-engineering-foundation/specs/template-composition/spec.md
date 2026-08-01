# Spec: template-composition

## Purpose

Define how Quicio Foundry composes a generated project from four
contributions: `base + profile + language + features`. Composition is
deterministic and produces a single `Manifest` that the writer then
turns into files. The goal of this capability is to make composition
the only primitive: there is no template per (profile, language)
pair.

## ADDED Requirements

### Requirement: Composition order

The system SHALL compose layers in the fixed order:
`base`, then `profile`, then `language`, then each `feature` in the
order given by the user.

#### Scenario: composition applies layers in fixed order

- **WHEN** `compose(base, profile, language, features)` runs
- **THEN** the resulting `Manifest` entries SHALL be ordered by the
  composition order above, with later layers appearing after earlier
  ones.

### Requirement: Manifest type

The system SHALL define a `Manifest` type whose entries describe a
file to be written:

- `path`: a relative POSIX path inside the target directory.
- `content`: the file contents as a UTF-8 string.
- `owner`: the layer that contributed the entry (`base`,
  `profile:<id>`, `language:<id>`, or `feature:<id>`).

#### Scenario: manifest entries carry owner metadata

- **WHEN** any entry is inspected
- **THEN** its `owner` SHALL be one of the documented values.

### Requirement: No overlapping paths

The system SHALL reject any composition whose `Manifest` contains two
entries with the same `path`.

#### Scenario: two layers write the same path

- **WHEN** two layers contribute an entry with the same relative
  `path`
- **THEN** `compose` SHALL throw a typed error naming both `owner`
  values and the offending `path`.

### Requirement: Empty feature set is the identity

The system SHALL treat an empty `features` array as identical to
omitting the argument.

#### Scenario: omitting features produces no feature entries

- **WHEN** `compose(base, profile, language)` is called
- **THEN** the resulting `Manifest` SHALL contain no entries whose
  `owner` starts with `feature:`.

#### Scenario: empty features array is identical to omission

- **WHEN** `compose(base, profile, language, [])` is called
- **THEN** it SHALL produce the same `Manifest` as
  `compose(base, profile, language)`.

### Requirement: Determinism

Given identical inputs, `compose` SHALL produce a `Manifest` whose
entries are byte-identical and order-identical across runs.

#### Scenario: same inputs produce the same manifest

- **WHEN** `compose` is called twice with the same arguments
- **THEN** both calls SHALL produce `Manifest` objects whose entries
  match path-for-path, content-for-content, and owner-for-owner.
