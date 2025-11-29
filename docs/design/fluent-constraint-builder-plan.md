# Fluent Constraint Builder Migration Plan

## Objective
- Capture the requirements for a fluent-style constraint builder (following the compact layout of `docs/draft/container_base.md`) and articulate how to incrementally replace the current `LayoutConstraintBuilder` surface without type-name collisions or loss of constraint metadata.

## Current Layout Constraint Surface
- `src/layout/layout_constraints.ts` already exposes `LayoutConstraintBuilder` (methods: `expr`, `eq`, `ge`) plus the `LayoutConstraints` orchestrator that records constraint batches and exposes arrangement helpers such as `arrangeHorizontal`, `alignLeft`, `encloseGrid`, etc.
- `SymbolBase` (`src/model/symbol_base.ts`) and all consumer symbols (e.g., `src/model/diagram_symbol.ts`, `src/plugin/core/...`, `src/plugin/uml/...`) receive the builder via `ensureLayoutBounds` and register symbol- and container-scoped constraint bundles.
- `LayoutContext` (`src/layout/layout_context.ts`) injects `LayoutVariables`, `LayoutSolver`, and `LayoutConstraints`, and provides helpers like `applyMinSize` or `registerContainerConstraints` that rely on `withSymbol`.
- Existing docs such as `docs/draft/symbol_constraints.md` and `docs/draft/refine_symbol_base.md` describe the current builder contract; the new fluent builder must honor those same extension points.

## Type Name Collision Check
- `rg "LayoutConstraintBuilder" -n src` shows the type is declared only once and imported across models/plugins/tests, so the new fluent implementation must either reuse that name or introduce a new one plus a clear migration path.
- No other `ConstraintBuilder` class exists in `@src`, so adopting the name from `docs/draft/new_constraint_builder.md` would not collide with runtime exports, but we must still ensure the API stays compatible with existing consumers during the transition.

## Fluent Constraint Builder Specification
- Reference: `docs/draft/new_constraint_builder.md` describes a chainable `ConstraintBuilder` with methods `expr(...)`, `eq(...)`, `ge(...)`, `le(...)`, zero-based shortcuts (`eq0`, `ge0`, `le0`), and strength finalizers (`strong`, `medium`, `weak`). It also keeps a `rawConstraints` array.
- The new implementation should:
  * Wrap the same `LayoutSolver` instance that `LayoutConstraints` already owns.
  * Emit `LayoutExpressionInput` terms compatible with `LayoutSolver.expression`.
  * Preserve `LayoutConstraintBuilder`’s `getRawConstraints()` so existing tests (e.g., `tests/symbol_base_layout.test.ts`) continue to inspect constraint counts.
  * Expose a fluent API that returns `this` to allow chained calls (e.g., `builder.expr(...).eq(...).strong()`).
  * Keep or translate strengths to `LayoutConstraintStrength` (required/strong/weak) so `LayoutContext` helpers can continue to pass deterministic values.

## Migration Roadmap
1. **Introduce the fluent builder module**
   - Create `src/layout/fluent_constraint_builder.ts` (or expand `layout_constraints.ts`) to implement the fluent API described above while reusing `LayoutSolver` helpers.
   - Ensure the implementation exports a single builder type (keep `LayoutConstraintBuilder` for backwards compatibility or add a new alias) so `SymbolBase` signatures do not break.
   - Acceptance: builder exposes `expr`, `eq`, `ge`, `le`, `strong`, `medium`, `weak`, zero shortcuts, and `getRawConstraints()`; unit tests can instantiate it directly.
2. **Bridge the builder to `LayoutConstraints` / `LayoutContext`**
   - Update `LayoutConstraints.withSymbol` to construct the fluent builder, call the symbol callback, and record the resulting `rawConstraints` (currently `LayoutConstraintBuilder` uses `getRawConstraints()` as well).
   - Keep metadata recording (`LayoutConstraintType`, `LayoutConstraintId`) unchanged so constraints added by hints (`arrange*`, `enclose*`) remain tracked.
   - Acceptance: injecting the new builder into `LayoutContext.applyMinSize` / `anchorToOrigin` produces identical constraint sets and metadata.
3. **Migrate existing symbol / plugin call sites**
   - Update `SymbolBase` and all subclass implementations (`src/model/diagram_symbol.ts`, `src/plugin/core/symbols/*`, `src/plugin/uml/symbols/*`) to prefer the fluent builder API (e.g., allow chaining and methods like `.expr()` if needed).
   - Review `tests/symbol_base_layout.test.ts` to validate the new builder shape (the fixture expects `builder.getRawConstraints()`).
   - Acceptance: no compile errors, and constraint-producing symbols add the same constraint count as before.
4. **Document and verify**
   - Expand docs (finalized in `docs/design/fluent-constraint-builder-plan.md` / `.ja.md`) to describe the new builder briefly in the style of `docs/draft/container_base.md`.
   - Update or add unit tests that exercise the fluent methods (e.g., symbol-specific constraints, builder zero shortcuts, strength finalizers).
   - Acceptance: `npm test` (or `bun test`) passes, and new tests cover the builder API.

## Testing & Verification
- Update `tests/symbol_base_layout.test.ts` to assert the builder delivers chained results and accumulates constraints exactly as before.
- Run the existing test suite (`npm run test` / `bun test`) to ensure no regressions in `diagram_symbol` or hint builders (`tests/grid_figure_builder.test.ts` already depends on `LayoutConstraints` metadata).
- Perform a TypeScript type-check (`tsc --noEmit`) to ensure exported types (including new builder name) do not clash.

## Risks & Notes
- The new builder must not disrupt container-specific logic that relies on `LayoutConstraintType.containerInbounds` metadata (`src/model/diagram_symbol.ts` references this when applying `ensureLayoutBounds`).
- If we change the exported builder name, we must provide a clear alias so third-party plugins depending on `LayoutConstraintBuilder` do not break.
- This plan assumes `docs/draft/new_constraint_builder.md` is the authoritative specification, but we should confirm with stakeholders whether to finalize that API before implementing.
