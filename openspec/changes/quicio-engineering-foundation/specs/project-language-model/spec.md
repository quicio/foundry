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
- `engines`: a free-form `{ key: version-requirement }` record of the
  language's runtime version constraints. TypeScript declares
  `engines.node`; Python declares `engines.python`. Other keys SHALL
  NOT appear.
- `wiring.check`, `wiring.test`, `wiring.build`: strings that resolve
  to a concrete script or task in the generated project.
- `wiring.format.write` and `wiring.format.check`: the two modes of
  the single abstract `format` command.
- `resolveBuild(buildKind)`: returns the concrete `build` command for
  a given abstract `buildKind`.
- `derivePackageName(projectName)`: returns the language's concrete
  package or distribution name for a validated project name.

`Language.wiring` is the mapping from abstract command names to
concrete invocations, and it is the only place that mapping exists.
The abstract set itself is fixed by the composition model and speced
in `template-composition`; no profile and no language redeclares it.
The field is named `wiring` rather than `commands` precisely so that
"the four names" and "how they are invoked" never read as the same
thing.

#### Scenario: language exposes the documented contract

- **WHEN** any registered language is inspected
- **THEN** it SHALL expose every field listed above, and the keys of
  its `wiring` object SHALL be exactly `check`, `test`, `build`, and
  `format`.

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
