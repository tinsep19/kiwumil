# Dependency Cleanup Plan

## 1. Background

The module export guidance captured in `docs/draft/export-index-conventions.md` institutes a strict rule set: each `src/` subdirectory exposes functionality exclusively through its `index.ts`, and external consumers refer to directories, not individual files. To operationalize those constraints, we need to inspect the current TypeScript codebase, align imports/exports, and ensure dependency graphs remain acyclic.

## 2. Objectives

- Audit the existing directory exports and module imports under `src/` to identify violations of the new rule set.
- Normalize each directory so that `index.ts` aggregates all public exports and contains no runtime logic.
- Refactor cross-directory imports to target the directory entry points, preventing direct file-level coupling and guarding against circular dependencies.
- Strengthen the toolchain (tsconfig/ESLint) to help maintain the pattern going forward.

## 3. Scope

- Target all directories inside `src/` that export functionality intended for reuse.
- Include both value exports (classes, functions) and type exports while distinguishing them where necessary (`export type` vs `export`).
- Monitor and adjust any circular reference scenarios encountered during refactoring.

## 4. Implementation Plan

| Step | Description | Dependencies | Acceptance Criteria |
| ---- | ----------- | ------------ | ------------------- |
| 1. Export Inventory | Use scripts or manual review (e.g., `rg "from .*src/"`) to catalog current export/import relationships per directory. | Access to `tsconfig.paths` to interpret aliases accurately. | Every directory has a documented list of exports and inbound consumers; any direct file imports are flagged. |
| 2. Synchronize Index Files | For directories missing an `index.ts` or not exporting everything, create/update the file so it re-exports every public symbol; ensure it only contains `export` statements. | Step 1 inventory. | Each directory exports its API solely through `index.ts`; no directories directly expose internal files. |
| 3. Refactor Consumers | Replace any direct imports from internal files (e.g., `../foo/bar`) with directory-level imports (e.g., `from "@/src/foo"`). | Step 2 ensures index exports cover needed symbols. | No consumer imports a file path outside its own directory; TypeScript compiles without import errors. |
| 4. Guard Against Circularity | When a cycle emerges (A imports B, B imports A), extract shared types into `types/` modules or convert to `export type` + delayed factories; document these cases. | Steps 2-3 may surface existing cycles. | Circular dependencies are either eliminated or reduced to type-only edges; runtime initialization order remains deterministic. |
| 5. Toolchain Enforcement | Update `tsconfig.json` aliases and add ESLint rules (or notes) so future changes favor directory imports and catch new direct file imports. | Steps 1-4 inform the required rule set. | Linting reports failures for file-level imports outside consumers, and tsconfig paths map to directories. |
| 6. Verification | Run the full test suite or relevant build checks to confirm exports resolve correctly after refactoring. | All prior steps completed. | Tests/build pass; type-checking sees no unresolved modules. |

## 5. Testing & Validation

- Run `npm run lint`/`npm run test` (or project-specific commands) after refactors to detect import/runtime problems.
- Consider adding ESLint `no-restricted-imports` patterns targeting direct file paths if practical.

## 6. Risks & Mitigations

- **Circular dependencies**: Temporarily isolate shared abstractions into dedicated `types/` modules; prefer type-only exports for mutually dependent files.
- **Missing exports**: Introduce a checklist per directory when updating `index.ts` to avoid breaking consumers.

## 7. Next Steps

1. Share this plan with the team and confirm the order of directories to tackle first (e.g., `src/shared` → `src/features` → `src/ui`).
2. Start with the Export Inventory step, then work through the table above, updating documentation as discoveries are made.
