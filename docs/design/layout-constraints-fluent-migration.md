# Layout Constraints Fluent Builder Migration

## Context

- The new `ConstraintsBuilder` (per `docs/draft/new_constraint_builder.md`) is already wired into parts of `LayoutConstraints`, but several helpers, hints, and exported types still rely on `KiwiSolver.addConstraint`/`.expression` or legacy type wrappers.
- Keeping these old pathways prolongs the `KiwiSolver` surface, encourages duplicated expression logic, and pits downstream consumers (hints, tests, docs) against both the old and new APIs.
- We need a written migration plan to ensure the remaining pieces adopt the fluent builder before removing the old exports and solver helpers.

## Objectives

1. Ensure every constraint-producing helper in `src/kiwi` (constraints utilities, hint builders, layout helpers) issues constraints exclusively through `ConstraintsBuilder`.
2. Eliminate unused Kiwi/Wrapping exports (`LayoutTerm`, `LayoutExpression`, solver expression helpers, etc.) without regressing any consumer expectations.
3. Capture the migration sequence, acceptance criteria, and testing steps so the team can coordinate multiple commits safely.

## Migration Plan

### 1. Finish migrating `LayoutConstraints` helpers

- **Steps**: Confirm that `arrange*`, `align*`, `enclose*`, and other utility methods build every constraint using a `ConstraintsBuilder` instance, collect the generated `rawConstraints`, and keep constraint metadata unchanged. Document the required builder flow (e.g., `expr(...).eq(...).strong()` for equality, `.ge()`/`.le()` for inequalities).
- **Acceptance**: Each helper uses `createConstraintsBuilder()` rather than `KiwiSolver.expression`/`.addConstraint`, the `rawConstraints` recorded by `record()` still match their previous counts, and `LayoutConstraintType`/`strength` mappings are unchanged.

### 2. Rewire `LayoutContext`/hint layers and tests

- **Steps**:
  1. Provide a safe way to create builders (e.g., `LayoutContext.createConstraintsBuilder()`), remove the `getSolver()` accessor, and drop direct solver usage from guides/tests.
  2. Update `guide_builder` methods to instantiate a fresh builder for each constraint, chain the fluent API, and finalize with the appropriate strength.
  3. Adjust tests (`bounds_validation`, `layout_variables`, builder unit tests, etc.) to use the new API, rely on `context.solve()` instead of `context.solver.updateVariables()`, and remove references to Kiwi operators or strengths when possible.
- **Acceptance**: No file outside `constraints_builder` calls `KiwiSolver.addConstraint`/`.expression`, guides/tests no longer rely on `LayoutContext.getSolver()` or private solver fields, and existing coverage still passes.

### 3. Prune legacy exports and re-export the new API consistently

- **Steps**:
  1. Remove unused Kiwi wrappers (`LayoutTerm`, `LayoutExpression`, `toKiwiExpression`, etc.) and re-export only the new `LayoutConstraintStrength`/`Operator` constants from `layout_constraints`.
  2. Update `src/index.ts` to surface the cleaned exports. Keep the exported `ConstraintsBuilder` handy for downstream consumers.
  3. Review `src/kiwi` exports for duplicates and ensure no stray `kiwi` imports remain.
- **Acceptance**: Only necessary types remain exported, public types align with `ConstraintsBuilder`, and ABI-compatible coverage (lint, tests, docs) stays green.

## Testing & Verification

- `bun test` (the full suite, including `constraints_builder.test.ts` + domain tests).
- `bun run lint` (fix remaining `@typescript-eslint/no-unused-vars` warnings as part of the cleanup).
- `tsc --noEmit` (already part of `bun test:types`, but re-run if necessary).

## Risks & Notes

- Removing `KiwiSolver` helpers must happen only after all consumers adopt the builder; this document is a guardrail before the final cut.
- Builder-based APIs replace Kiwi expressions but still produce `kiwi.Constraint` internally, so existing `rawConstraints` checks should continue to pass.
