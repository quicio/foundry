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

### Requirement: Features are additive-only in v0

A feature SHALL contribute new files only. v0 SHALL NOT provide any
merge, patch, or append strategy: there is no way for a feature to
add a script, a dependency, or a configuration key to a file owned
by `base`, `profile`, or `language`. A feature that needs to modify
an existing file is a blocker to surface, not a case to work around.

This is a deliberate v0 restriction. Introducing a merge strategy
(for example a per-entry `strategy: create | merge-json | merge-toml`)
is the subject of a separate OpenSpec change, to be opened when a
real feature requires it.

#### Scenario: a feature contributing an owned path fails

- **WHEN** a feature contributes an entry whose `path` is already
  owned by `base`, `profile`, or `language`
- **THEN** `compose` SHALL throw the same typed error as any other
  path collision, naming both `owner` values and the `path`.

### Requirement: Feature contribution signature

A feature module SHALL expose
`contribute(context) -> ManifestEntry[]`, where `context` carries the
resolved profile `buildKind`, the language `id`, the project name,
and the path conventions exposed by `composition`. A feature module
SHALL NOT receive the accumulated `Manifest` and SHALL NOT return
one. The composition engine, not the feature, appends the returned
entries and enforces path uniqueness.

#### Scenario: a feature cannot observe or rewrite other layers

- **WHEN** `contribute(context)` is invoked on any feature module
- **THEN** the argument SHALL NOT expose entries contributed by
  `base`, `profile`, `language`, or another feature.

#### Scenario: a feature returning no entries changes nothing

- **WHEN** a feature's `contribute` returns an empty array
- **THEN** the resulting `Manifest` SHALL be identical, path-for-path
  and content-for-content, to the `Manifest` produced without that
  feature.

### Requirement: Profile-to-language resolution boundary

`composition` SHALL be the only module that reads both the resolved
`Profile` and the resolved language module. It SHALL pass the
profile's `buildKind` to the language module and SHALL NOT pass
`Profile.id` or any other profile field. `profiles` and `languages`
SHALL NOT import each other.

#### Scenario: language module receives buildKind, not the profile

- **WHEN** `compose` invokes the language module to resolve the
  concrete `build` wiring
- **THEN** the argument SHALL be the `buildKind` value only, and the
  language module SHALL produce identical output for two different
  profiles that declare the same `buildKind`.

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

### Requirement: No non-deterministic inputs in generated content

Determinism is not achievable by assertion alone, so the sources of
non-determinism are prohibited explicitly. Generated content SHALL
NOT depend on:

- the current date or time, including a year in a licence header or
  a generated-on comment;
- random or pseudo-random values, including generated ids;
- the host environment: username, home directory, absolute paths,
  hostname, locale, or environment variables;
- iteration over an unordered collection. Every JSON object and TOML
  table SHALL be emitted in a fixed, literal key order;
- a dependency version that is not an exact literal, as required by
  `typescript-toolchain` and `python-toolchain`.

The only permitted inputs are the validated project name, the
profile, the language, and the resolved feature set.

#### Scenario: two runs a day apart are identical

- **WHEN** `compose` runs with the same arguments on two different
  dates, under two different users, from two different working
  directories
- **THEN** both manifests SHALL be byte-identical.

#### Scenario: no generated file carries a timestamp

- **WHEN** every entry's `content` is inspected
- **THEN** none SHALL contain a date, a time, a hostname, or an
  absolute filesystem path.

#### Scenario: key order is literal, not iterated

- **WHEN** a generated `package.json` or `pyproject.toml` is parsed
  and re-serialised across two runs
- **THEN** the key order SHALL be identical in both.
