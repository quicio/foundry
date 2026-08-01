# Spec: speck-integration

## Purpose

Reserve the `speck-integration` feature as a named slot in Quicio
Foundry's feature registry. **This change ships only the slot.**
The actual integration with Speck (adding a `speck.config.ts` to the
generated project, choosing which conventions the project indexes)
is a follow-up OpenSpec change that the product owner opens once a
real consumer exists.

Quicio Foundry MUST NOT share domain entities, types, or runtime
modules with Speck. Integration means: the generated project ships
a config file that the user's local Speck installation can read.
Foundry itself does not import, link, or depend on Speck.

The registry contents (which features are registered) are governed
by `feature-model`. This spec governs only the *behaviour* of the
stub registered under `speck-integration`.

## ADDED Requirements

### Requirement: Stub module presence

The system SHALL register a feature module under the id
`speck-integration` whose `contribute(context)` returns an empty
array of manifest entries.

#### Scenario: stub contributes nothing

- **WHEN** `contribute(context)` is called on the stub
- **THEN** it SHALL return an empty `ManifestEntry[]`.

### Requirement: Feature flag acceptance

`--with speck-integration` SHALL be accepted by the CLI and SHALL
resolve to the stub module.

#### Scenario: enabling the feature is a no-op

- **WHEN** `--with speck-integration` is passed alongside the
  default (library, typescript) selection
- **THEN** the generated project SHALL be byte-identical to the
  same project generated without the flag.

### Requirement: No coupling between Foundry and Speck

The Foundry codebase SHALL NOT import, link, or depend on Speck
modules. The slot exists so a future change can write a config file
into the generated project; the implementation, when it lands, will
own that file format and Foundry will only own the path.

#### Scenario: foundry has no speck dependency

- **WHEN** the Foundry manifest is read (e.g. `package.json` for
  TypeScript, `pyproject.toml` for Python)
- **THEN** it SHALL NOT list Speck as a dependency, devDependency,
  or peerDependency.

### Requirement: Implementation deferred

This spec SHALL NOT document any concrete behavior beyond the stub
and the coupling constraint. Adding real behavior is the
responsibility of a separate OpenSpec change.

#### Scenario: spec describes no committed behavior

- **WHEN** this `spec.md` is read in full
- **THEN** it SHALL contain no `SHALL` requirement beyond the
  empty-contribution stub, the flag-acceptance, and the no-coupling
  scenarios above.
