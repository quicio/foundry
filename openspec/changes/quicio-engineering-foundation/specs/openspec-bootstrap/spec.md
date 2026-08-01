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

The registry contents (which features are registered) are governed
by `feature-model`. This spec governs only the *behaviour* of the
stub registered under `openspec-bootstrap`.

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

### Requirement: No runtime coupling between Foundry and OpenSpec

Quicio Foundry SHALL NOT import or link OpenSpec modules, and SHALL
NOT list OpenSpec as a runtime `dependency` or `peerDependency`. The
slot exists so a future change can write an `openspec/` folder into
the generated project; the implementation, when it lands, will own
that folder format and Foundry will only own the paths.

Using the OpenSpec **CLI as a development tool** is explicitly not
coupling. Foundry's own specs are authored with it, and pinning it as
a development dependency is consistent with the pinning policy in
`design.md` §8.1. The constraint being protected is that no Foundry
code path imports OpenSpec at runtime, not that the tool is absent
from the repo.

#### Scenario: foundry declares no runtime openspec dependency

- **WHEN** the Foundry manifest is read (e.g. `package.json` for
  TypeScript, `pyproject.toml` for Python)
- **THEN** it SHALL NOT list OpenSpec under `dependencies` or
  `peerDependencies`.

#### Scenario: no source file imports openspec

- **WHEN** the Foundry source tree is inspected
- **THEN** no module SHALL import from OpenSpec.

#### Scenario: the CLI may be a development dependency

- **WHEN** OpenSpec appears under `devDependencies` as the tool used
  to author and validate this change
- **THEN** that SHALL NOT violate this requirement.

### Requirement: Implementation deferred

This spec SHALL NOT document any concrete behavior beyond the stub.
Adding real behavior is the responsibility of a separate OpenSpec
change that the product owner opens when a consumer exists.

#### Scenario: spec describes no committed behavior

- **WHEN** this `spec.md` is read in full
- **THEN** it SHALL contain no `SHALL` requirement beyond the
  empty-contribution stub, the flag-acceptance, and the no-coupling
  scenarios above.
