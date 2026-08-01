# Spec: feature-model

## Purpose

Define the feature registry and the resolution semantics of
`--with` / `--without`. Features are the fourth axis of the
composition model (`base + profile + language + features`) and the
only opt-in one.

The original change assumed `features.get(id)` existed and that
`--with unknown` failed, without ever specifying the type, the
registry contents, or what `--without` means when nothing is enabled
by default. This capability closes that gap. It does **not** add any
feature behaviour: the two registered features remain empty stubs,
speced in `openspec-bootstrap` and `speck-integration`.

## ADDED Requirements

### Requirement: Feature type

The system SHALL define a `Feature` type with the following required
fields:

- `id`: a stable kebab-case identifier.
- `description`: a one-line, documentation-only description.
- `contribute(context)`: returns a `ManifestEntry[]`, as specified in
  `template-composition`.

#### Scenario: feature exposes the documented contract

- **WHEN** any registered feature is inspected
- **THEN** it SHALL expose `id`, `description`, and `contribute`.

### Requirement: Feature registry

The system SHALL maintain a feature registry keyed by `id` and SHALL
expose a lookup function that returns the `Feature` for a given id.

#### Scenario: lookup an unknown feature fails

- **WHEN** `getFeature('docker')` is called
- **THEN** it SHALL throw a typed error whose message lists every
  registered `id`.

### Requirement: Registered feature set is exactly the speced ones

The registry SHALL contain exactly the features that have a spec in
this change: `openspec-bootstrap` and `speck-integration`.

`github-actions` and `docker` are named in the roadmap but SHALL NOT
be registered in v0. Registering a feature with no spec is the same
anticipation the proposal forbids in N4, and it would make
`--with <unspeced feature>` silently succeed as a no-op instead of
failing honestly.

#### Scenario: roadmap-only features are not resolvable

- **WHEN** `--with docker` or `--with github-actions` is passed
- **THEN** the CLI SHALL exit with code 2 and the error SHALL list
  the registered feature ids.

#### Scenario: registry contains exactly two features

- **WHEN** the registry is enumerated
- **THEN** it SHALL contain exactly the ids `openspec-bootstrap` and
  `speck-integration`.

### Requirement: Empty default feature set

No feature SHALL be enabled by default. The resolved feature set for
an invocation with no `--with` flags SHALL be empty.

#### Scenario: no flags yields no features

- **WHEN** `quicio new demo` is run with no feature flags
- **THEN** the resolved feature set SHALL be empty and the manifest
  SHALL contain no entry whose `owner` starts with `feature:`.

### Requirement: Resolution semantics of --with and --without

Feature selection SHALL resolve as follows:

- Every id named in `--with` or `--without` SHALL be validated
  against the registry first. An unknown id fails with exit code 2,
  regardless of which flag named it.
- `--with <id>` adds a registered feature to the resolved set.
- `--without <id>` removes it. Because the default set is empty,
  `--without` on a feature that is not enabled SHALL be accepted as
  a no-op rather than an error. The flag exists so that invocations
  stay stable once a future change introduces defaults.
- The same id in both flags fails with exit code 2, as specified in
  `project-generator-cli`.
- Repeating the same id in the same flag SHALL be accepted and SHALL
  resolve to a single occurrence.

#### Scenario: --without an unknown feature still fails

- **WHEN** `--without docker` is passed
- **THEN** the CLI SHALL exit with code 2, because validation
  precedes resolution.

#### Scenario: --without a known but disabled feature is a no-op

- **WHEN** `--without speck-integration` is passed with no matching
  `--with`
- **THEN** the CLI SHALL exit 0 and the generated project SHALL be
  byte-identical to the same project generated without the flag.

#### Scenario: a repeated --with resolves once

- **WHEN** `--with speck-integration --with speck-integration` is
  passed
- **THEN** the resolved feature set SHALL contain the id once, and
  `contribute` SHALL be invoked once.

### Requirement: Feature order is the user's order

The resolved feature set SHALL preserve the order in which `--with`
flags appeared, and `compose` SHALL invoke `contribute` in that
order.

#### Scenario: two features contribute in flag order

- **WHEN** `--with openspec-bootstrap --with speck-integration` is
  passed
- **THEN** the manifest entries owned by `feature:openspec-bootstrap`
  SHALL precede those owned by `feature:speck-integration`.
