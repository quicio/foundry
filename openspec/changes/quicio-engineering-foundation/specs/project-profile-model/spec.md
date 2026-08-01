# Spec: project-profile-model

## Purpose

Define the canonical profile model used by Quicio Foundry. A profile
describes the *role* of a generated project (library, application,
experiment) and the abstract commands it must expose, independent of
any particular language. Profiles are the second axis of the
composition model (`base + profile + language + features`).

This capability covers the **type**, the **registry**, and the
**per-profile metadata**. It does not cover how a profile contributes
files to the manifest; that is `template-composition`.

## ADDED Requirements

### Requirement: Profile type

The system SHALL define a `Profile` type with the following required
fields:

- `id`: a stable kebab-case identifier (`library`, `application`,
  `experiment`).
- `displayName`: a human-readable label.
- `description`: a one-line description of the profile's role.
- `commands`: an array containing the four abstract command names
  (`check`, `test`, `build`, `format`) in that fixed order.
- `buildKind`: one of `distributable` or `none`. It is the only
  channel through which a profile influences a language module's
  build wiring.

#### Scenario: profile exposes all four abstract commands

- **WHEN** any registered profile is inspected
- **THEN** its `commands` array SHALL contain exactly
  `['check', 'test', 'build', 'format']` in that order.

### Requirement: Abstract command set is exactly four

The abstract command set SHALL be exactly `check`, `test`, `build`,
`format`. `format` SHALL have two modes, `write` and `check`; the
modes are two invocations of the same abstract command and SHALL NOT
be modelled as a fifth command. Concrete script or task names that a
language module chooses for the check mode (for example
`format:check` in `package.json` or `format-check` in
`pyproject.toml`) are implementation details of that language module
and SHALL NOT appear in the abstract model.

#### Scenario: no fifth abstract command exists

- **WHEN** any registered profile or any registered language module
  is enumerated for abstract command names
- **THEN** the resulting set SHALL be exactly
  `['check', 'test', 'build', 'format']` and SHALL NOT contain
  `format:check`, `format-check`, or any other variant.

### Requirement: buildKind is the profile's only build input

A `Profile` SHALL declare `buildKind` and SHALL NOT declare any
concrete build command. A language module SHALL read `buildKind`
and SHALL NOT read `Profile.id`.

#### Scenario: buildKind values for the initial profile set

- **WHEN** the registry is enumerated
- **THEN** `library` and `application` SHALL declare
  `buildKind: 'distributable'` and `experiment` SHALL declare
  `buildKind: 'none'`.

#### Scenario: language modules never branch on profile id

- **WHEN** a language module resolves its `build` wiring
- **THEN** it SHALL receive only `buildKind` and SHALL NOT receive
  or reference `Profile.id`.

### Requirement: Profile registry

The system SHALL maintain a profile registry keyed by `id` and SHALL
expose a lookup function that returns the `Profile` for a given id.

#### Scenario: lookup a known profile

- **WHEN** `getProfile('library')` is called
- **THEN** it SHALL return a `Profile` whose `id` is `'library'`
  and whose `commands` is `['check', 'test', 'build', 'format']`.

#### Scenario: lookup an unknown profile fails

- **WHEN** `getProfile('unknown')` is called
- **THEN** it SHALL throw a typed error whose message lists every
  registered `id`.

### Requirement: Initial profile set

The system SHALL register exactly three profiles for v0:
`library`, `application`, `experiment`.

#### Scenario: registry contains the three initial profiles

- **WHEN** the registry is enumerated
- **THEN** it SHALL contain exactly the ids `library`,
  `application`, `experiment`, in insertion order.

### Requirement: Profile isolation from language

A `Profile` object SHALL NOT reference any language-specific
identifier (e.g. `ts`, `python`, `pnpm`, `uv`). Profile metadata is
language-agnostic.

#### Scenario: profile metadata contains no language strings

- **WHEN** every registered profile's metadata is stringified
- **THEN** no string value SHALL contain a language id.
