# Spec: project-language-model

## Purpose

Define the canonical language model used by Quicio Foundry, as the
symmetric counterpart of `project-profile-model`. A language describes
the *toolchain* of a generated project: package manager, test runner,
formatter, type checker, and the mapping from the four abstract
commands to concrete scripts or tasks. Languages are the third axis of
the composition model (`base + profile + language + features`).

This capability covers the **type**, the **registry**, and the
**per-language metadata contract**. The concrete content of each
language lives in `typescript-toolchain` and `python-toolchain`. The
existence of this spec closes an asymmetry in the original change:
profiles had a typed registry with a documented failure mode, and
languages did not, even though the CLI is required to validate
`--language` against one.

## ADDED Requirements

### Requirement: Language type

The system SHALL define a `Language` type with the following required
fields:

- `id`: a stable kebab-case identifier (`typescript`, `python`).
- `displayName`: a human-readable label.
- `packageManager`: the package manager the generated project uses.
- `commands.check`, `commands.test`, `commands.build`: strings that
  resolve to a concrete script or task in the generated project.
- `commands.format.write` and `commands.format.check`: the two modes
  of the single abstract `format` command.
- `resolveBuild(buildKind)`: returns the concrete `build` command for
  a given abstract `buildKind`.
- `derivePackageName(projectName)`: returns the language's concrete
  package or distribution name for a validated project name.

#### Scenario: language exposes the documented contract

- **WHEN** any registered language is inspected
- **THEN** it SHALL expose every field listed above, and its abstract
  command names SHALL be exactly `check`, `test`, `build`, `format`.

### Requirement: Language registry

The system SHALL maintain a language registry keyed by `id` and SHALL
expose a lookup function that returns the `Language` for a given id.

#### Scenario: lookup a known language

- **WHEN** `getLanguage('typescript')` is called
- **THEN** it SHALL return a `Language` whose `id` is `'typescript'`.

#### Scenario: lookup an unknown language fails

- **WHEN** `getLanguage('klingon')` is called
- **THEN** it SHALL throw a typed error whose message lists every
  registered `id`.

### Requirement: Initial language set

The system SHALL register exactly two languages for v0:
`typescript`, `python`.

#### Scenario: registry contains the two initial languages

- **WHEN** the registry is enumerated
- **THEN** it SHALL contain exactly the ids `typescript`, `python`,
  in insertion order.

### Requirement: Language isolation from profile

A `Language` module SHALL receive the profile's abstract `buildKind`
and nothing else about the profile. It SHALL NOT import from
`profiles` and SHALL NOT reference a profile id.

#### Scenario: language module does not import profiles

- **WHEN** the import graph of any language module is inspected
- **THEN** it SHALL contain no edge into `profiles`.

#### Scenario: language module source names no profile

- **WHEN** any language module's source is inspected
- **THEN** it SHALL NOT contain the strings `library`,
  `application`, or `experiment`.

### Requirement: Same buildKind produces the same build wiring

Two different profiles that declare the same `buildKind` SHALL
produce identical build wiring from a given language module.

#### Scenario: library and application resolve identically

- **WHEN** `resolveBuild('distributable')` is called for a language
- **THEN** the returned command SHALL be identical regardless of
  whether the caller resolved it from `library` or `application`.
