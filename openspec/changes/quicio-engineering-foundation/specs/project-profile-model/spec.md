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

#### Scenario: profile exposes all four abstract commands

- **WHEN** any registered profile is inspected
- **THEN** its `commands` array SHALL contain exactly
  `['check', 'test', 'build', 'format']` in that order.

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
