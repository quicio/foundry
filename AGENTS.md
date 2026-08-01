# AGENTS.md

Working contract for any agent or contributor operating in this
repository. It is versioned on purpose: `.opencode/` is gitignored, so
without this file the operating rules do not travel with the repo.

## What this repo is

Quicio Foundry is a **project generator**. It composes
`base + profile + language + selected features` into a working,
verifiable project. It is not a runtime library, not a domain library,
and it shares no entities with Speck or OpenSpec.

## Current state

**Pre-implementation.** There is no source code. The repo holds one
OpenSpec change under
`openspec/changes/quicio-engineering-foundation/`:

- `proposal.md` — why, goals, non-goals, success criteria
- `design.md` — boundaries, composition model, exit codes, failure modes
- `tasks.md` — TDD slices, one per commit
- `specs/<capability>/spec.md` — 11 capabilities with `SHALL`
  requirements and `WHEN/THEN` scenarios

## Hard rules

1. **No code before approval.** Task 0.2 gates every implementation
   task. Do not start capability 1 until the product owner has
   approved proposal, design, tasks, and the 11 specs.
2. **Spec first, then code.** Behaviour that is not in a spec does not
   get implemented. If you need it, propose the spec change; do not
   write it and document it afterwards.
3. **One task per commit.** A commit turns one red test green, or
   refactors a green state without breaking any green. Do not batch.
4. **Stay in the in-flight task range.** If you hit a blocker, stop
   and surface it. Do not silently expand scope.
5. **Validate before committing spec edits:**
   `openspec validate --changes` must report 0 failed.

## Invariants that are easy to break

These exist because they were violated in the first draft of the
specs. Re-introducing any of them is a defect, not a style choice.

- The abstract command set is **exactly four**: `check`, `test`,
  `build`, `format`. `format` has two modes, `write` and `check`.
  `format:check` and `format-check` are concrete script and task
  names owned by a language module; they never reach the abstract
  model.
- **Profiles and languages never import each other.** The only value
  that crosses is the profile's `buildKind` (`distributable | none`),
  carried by `composition`. A language module that contains the
  string `library`, `application`, or `experiment` is a bug.
- **Features are additive-only.** `contribute(context)` returns new
  manifest entries. It never receives the accumulated manifest, so it
  cannot rewrite another layer's file. A feature that needs to modify
  an existing file is a blocker to surface, not a case to work
  around with an ad-hoc merge.
- **The generator never overwrites a file.** `--force` permits a
  non-empty target directory and nothing else.
- **Everything is deterministic.** No dates, no random values, no
  host-derived paths, no map iteration order, no floating dependency
  versions.
- **Python needs two names.** `my-lib` is the distribution name;
  `my_lib` is the module directory and the import. Conflating them
  produces a project that installs and then fails its own first test.

## Verification contract

Every generated project exposes working `check`, `test`, `build`, and
`format`. A generated project missing any of them is a bug in the
generator, not a project decision. The real gate is the end-to-end
smoke test that generates each supported pair and runs all four; unit
tests alone are not sufficient.

## Commands

```
openspec validate --changes     # check the change is well-formed
```

There is nothing else to run yet. Once capability 1 lands, the
generator itself ships the same `check/test/build/format` contract it
enforces, and those become the local gate.

## Style

Specs are written to be executed by someone who was not in the
conversation. Prefer a testable scenario over an adjective. When a
decision has a cost, state the cost in the document rather than
leaving the next reader to discover it.
