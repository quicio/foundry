# Spec: project-profile-model

## Purpose

Define the canonical profile model used by Quicio Foundry. A profile
describes the *role* of a generated project (library, application,
experiment): the shape of its source tree, the convention for its
tests, and whether it produces a distributable artifact. It says
nothing about any particular language. Profiles are the second axis
of the composition model (`base + profile + language + features`).

The abstract command set is **not** a profile concern. It is fixed by
the composition model and speced in `template-composition`; a profile
carries no `commands` field.

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
- `buildKind`: one of `distributable` or `none`. It is the only
  channel through which a profile influences a language module's
  build wiring.

The abstract command set (`check`, `test`, `build`, `format`) is
fixed by the composition model itself; it is not a per-profile value,
so the `Profile` type carries no `commands` field. That invariant is
speced in `template-composition`, and the mapping from abstract names
to concrete invocations lives in `Language.wiring`.

#### Scenario: profile does not declare a commands field

- **WHEN** any registered profile is inspected
- **THEN** it SHALL NOT expose a `commands` field; the four abstract
  commands are a property of the composition model, not of the
  profile.

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
- **THEN** it SHALL return a `Profile` whose `id` is `'library'` and
  whose `buildKind` is `'distributable'`.

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

A `Profile` SHALL be language-agnostic. The invariant is structural,
not textual: the `profiles` module SHALL NOT import from `languages`,
and the `Profile` type SHALL expose no field capable of carrying a
toolchain value. A profile's only influence on the toolchain is its
`buildKind`.

The original wording asked for a substring scan over stringified
metadata. That is a heuristic, not a proof: it fails on an innocent
description and passes on a genuine leak stored under a different
name. The import-graph check is the one that actually holds.

#### Scenario: profiles do not import languages

- **WHEN** the import graph of the `profiles` module is inspected
- **THEN** it SHALL contain no edge into `languages`.

#### Scenario: no profile field can hold a toolchain value

- **WHEN** the `Profile` type is inspected
- **THEN** its fields SHALL be exactly `id`, `displayName`,
  `description`, and `buildKind`, and none SHALL be a free-form
  toolchain, script, or dependency field.

#### Scenario: metadata smoke check on exact tokens

- **WHEN** each registered profile's `id` value is compared against
  the exact tokens `typescript`, `python`, `pnpm`, and `uv`
- **THEN** none SHALL match. This is a smoke check over identifier
  fields only; `description` is free prose and SHALL NOT be scanned.
