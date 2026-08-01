# Spec: openspec-bootstrap

## Purpose

Reserve the `openspec-bootstrap` feature as a named slot in Quicio
Foundry's feature registry. **This change ships only the slot.**
The actual implementation of OpenSpec bootstrap (running `openspec
init` against the generated project, templating the `openspec/`
folder) is a follow-up OpenSpec change that the product owner opens
once a real consumer (an actual generated project that asks for the
feature) exists.

Per the product owner's rule, features MUST NOT be implemented
without a real consumer.

## ADDED Requirements

### Requirement: Stub module presence

The system SHALL register a feature module under the id
`openspec-bootstrap` whose `contribute(context)` returns an empty
array of manifest entries.

#### Scenario: stub contributes nothing

- **WHEN** `contribute(context)` is called on the stub
- **THEN** it SHALL return an empty `ManifestEntry[]`.

### Requirement: Feature flag acceptance

`--with openspec-bootstrap` SHALL be accepted by the CLI and SHALL
resolve to the stub module.

#### Scenario: enabling the feature is a no-op

- **WHEN** `--with openspec-bootstrap` is passed alongside the
  default (library, typescript) selection
- **THEN** the generated project SHALL be byte-identical to the
  same project generated without the flag.

### Requirement: Implementation deferred

This spec SHALL NOT document any concrete behavior beyond the stub.
Adding real behavior is the responsibility of a separate OpenSpec
change that the product owner opens when a consumer exists.

#### Scenario: spec describes no committed behavior

- **WHEN** this `spec.md` is read in full
- **THEN** it SHALL contain no `SHALL` requirement beyond the
  empty-contribution stub and the flag-acceptance scenarios above.
