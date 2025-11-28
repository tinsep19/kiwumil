# Decoupling LayoutConstraints from Symbols

## Context

- `LayoutConstraints` currently resolves `SymbolId` → `SymbolBase` to access `layout`/`container` bounds for every hint (`arrange*`, `align*`, `enclose*`, etc.). This keeps the constraint management layer tightly coupled to symbol lookup and prevents the solver-focused logic from operating purely on `Bounds`.
- We plan to add a lightweight tracking identifier directly on each `Bounds` and make the Hint layer resolve symbols once, so `LayoutConstraints` only needs bounds data and the identifier for metadata (e.g., `record()` IDs).

## Objectives

1. Introduce `boundId` on every bounds instance so constraint tracking no longer depends on the original `SymbolId`.
2. Ensure hint builders resolve `SymbolId` → bounds (including optional container bounds) only once and pass those resolved targets into `LayoutConstraints`.
3. Refactor `LayoutConstraints` to work purely with bounds/variables, removing the injected `resolveSymbol` and symbol lookups.

## Solution Overview

| Area | Change |
| --- | --- |
| Bounds model | Expose `boundId` (derived from the owning symbol) alongside existing `LayoutVar` fields so IDs persist through the solver without needing the symbol itself. |
| HintFactory / builders | Resolve every `LayoutTargetId` into a `LayoutConstraintTarget` ( `{ ownerId: string; layout: LayoutBounds; container?: ContainerBounds }` ) during `normalizeTargets` or the builder-specific helper. Pass these targets directly to `LayoutConstraints`. Preserve nest-level updates. |
| LayoutConstraints | Accept `LayoutConstraintTarget[]` instead of `LayoutSymbolId[]`, use `target.layout`/`target.container` to build constraints, and consume `target.ownerId` (or `boundId`) when generating scoped IDs. Drop the `resolveSymbol` constructor argument. |

## Plan

1. **Add boundId to Bounds**
   - Update `Bounds`/`BoundsMap` definitions (`src/layout/bounds.ts`) to include `boundId: string`.
   - Ensure `LayoutVariables.createBound()` generates a stable `boundId` (e.g., based on the provided identifier) and attaches it to the returned bounds.
   - Acceptance: Bounds expose `boundId`, and all existing consumers compile without needing symbol lookups.

2. **Resolve symbols in Hint layer**
   - Extend `HintFactory.normalizeTargets` (or add a dedicated helper) to map each `LayoutTargetId` → `{ ownerId: boundId; layout: LayoutBounds; container?: ContainerBounds }`.
   - Update Grid/Figure builders and guide APIs to use the resolved targets when calling `LayoutConstraints`.
   - Acceptance: Builders only pass bounds data + ownerId; they no longer call `resolveSymbol` within `LayoutConstraints`.

3. **Refactor LayoutConstraints**
   - Change method signatures (e.g., `arrangeHorizontal(targets: LayoutConstraintTarget[])`).
   - Use `target.layout`/`target.container` to access `LayoutVar` instances without `resolveSymbol`.
   - Update `record()` to use `target.boundId` (or `ownerId`) when generating scoped IDs.
   - Remove the constructor dependency on `resolveSymbol`.
   - Acceptance: Constraint creation works purely on bounds, and tests still capture the same behavior.

## Testing & Risks

- Update existing layout hint tests to align with the new target-based signatures (e.g., `tests/layout_constraints.test.ts`).
- Risk: If some symbols lack container bounds, ensure the new target helper gracefully omits `container` to avoid runtime errors.
- Timeline: Each major area should take ~1 day, with integration testing once all refactors are in place.
