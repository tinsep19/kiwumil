[日本語](circular-dependency-prevention.ja.md) | English

# Circular Dependency Prevention Guidelines

## Summary

This document provides guidelines to prevent circular dependencies in a TypeScript project and to maintain a healthy architecture.

## Current problems and ESLint rule limitations

### Issues

1. Re-exports across directories can create cycles: e.g. `kiwi/index.ts` re-exports from `model`, while `model` imports from `kiwi`.
2. Manual exception management: ESLint exceptions for cycles are hard-coded for specific files.
3. Lack of visibility into dependencies: it's hard to know which modules depend on others.

### Current ESLint approach limitations

```javascript
// Current: manual exceptions for specific files
files: [
  "src/plugin/core/symbols/circle_symbol.ts",
  "src/plugin/uml/symbols/actor_symbol.ts", 
  "src/plugin/uml/relationships/association.ts"
]
```

This approach requires manual updates when new files are added, and reasons for exceptions are unclear, making it unscalable.

## New approach: layer-based architecture

### 1. Define architecture layers

```
Layer 4: DSL        (dsl/)
   ↓
Layer 3: Plugins    (plugin/, render/)
   ↓  
Layer 2: Model      (model/, hint/)
   ↓
Layer 1: Core       (core/, kiwi/, theme/, icon/, item/, utils/)
```

Rule: Higher layers may depend on lower layers, but lower layers must not depend on higher layers.

### 2. Prevent intra-layer cycles

Avoid cycles within each layer.

#### Core Layer (Layer 1)
- `core/`: only type definitions, no external dependencies
- `kiwi/`: depends only on `core/`
- `theme/`, `icon/`, `utils/`: depend only on `core/`
- `item/`: depends on `core/` and `icon/` (base classes for renderable items)

#### Model Layer (Layer 2)
- `model/`: depends on `core/`, `kiwi/`, `theme/`, `item/`
- `hint/`: depends on `model/`, `kiwi/`, `core/`

#### Plugin Layer (Layer 3)
- `plugin/`: may depend on lower layers (`core/`, `theme/`, `icon/`, `item/`, `utils/`, `model/`, `hint/`)

#### DSL Layer (Layer 4)
- `dsl/`: may depend on all layers (DSL-only dependency on `kiwi/` is allowed)

### 3. Improved ESLint rule design

#### A. Layer-based rules

```javascript
const LAYER_RULES = {
  'core/**': [], // cannot depend on other layers
  'kiwi/**': ['core/**'],
  'theme/**': ['core/**'], 
  'icon/**': ['core/**'],
  'item/**': ['core/**', 'icon/**'],
  'utils/**': ['core/**'],
  'model/**': ['core/**', 'theme/**', 'item/**'],
  'hint/**': ['core/**', 'model/**'],
  'plugin/**': ['core/**', 'theme/**', 'item/**', 'model/**', 'hint/**'],
  'render/**': ['core/**', 'theme/**', 'model/**', 'plugin/**'],
  'dsl/**': ['core/**', 'kiwi/**', 'theme/**', 'item/**', 'model/**', 'hint/**', 'plugin/**', 'render/**']
}
```

#### B. Detect intra-layer cycles

```javascript
const INTRA_LAYER_RULES = {
  'model/layout_context.ts': {
    forbidden: ['model/**'],
    exceptions: ['model/layout_variables.ts', 'model/hints.ts']
  }
}
```

## Implementation guidelines

### 1. Principle for index.ts re-exports

✅ Recommended pattern:

```typescript
// ✅ exports within the same directory
export { SymbolBase } from "./symbol_base"
export { DiagramSymbol } from "./diagram_symbol"

// ✅ re-exporting from lower layers as types or utilities
export type { CassowarySolver } from "../core"
export { getBoundsValues } from "../core"
```

❌ Anti-patterns:

```typescript
// ❌ re-export from equal or higher layers
export { LayoutVariables } from "../model" // kiwi/ → model/

// ❌ re-export causing cycles
export { DiagramBuilder } from "../dsl" // model/ → dsl/ → model/
```

### 2. Decoupling via dependency injection

Before: direct dependency

```typescript
export class LayoutContext {
  constructor(theme: Theme) {
    this.solver = new KiwiSolver() // direct dependency
  }
}
```

After: injection

```typescript
export class LayoutContext {
  constructor(solver: CassowarySolver, theme: Theme) {
    this.solver = solver // injected dependency
  }
}
```

### 3. Test design patterns

✅ Recommended: assemble dependencies explicitly

```typescript
beforeEach(() => {
  const solver = new KiwiSolver()
  const context = new LayoutContext(solver, DefaultTheme)
  const symbols = new Symbols(context.variables)
})
```

❌ Avoid: hiding dependencies

```typescript
beforeEach(() => {
  const context = new LayoutContext(DefaultTheme) // creates solver internally
})
```

## ESLint rule improvements

### 1. New custom rule

```javascript
// eslint-rules/layer-dependency.js
const LAYERS = {
  core: 1,
  kiwi: 1, 
  theme: 1,
  icon: 1,
  item: 1,
  utils: 1,
  model: 2,
  hint: 2,
  plugin: 3,
  dsl: 4,
  render: 4
}

function getLayerLevel(filePath) {
  const segments = filePath.split('/')
  const srcIndex = segments.indexOf('src')
  const layerName = segments[srcIndex + 1]
  return LAYERS[layerName] || 999
}

function validateLayerDependency(importerPath, importeePath) {
  const importerLayer = getLayerLevel(importerPath)
  const importeeLayer = getLayerLevel(importeePath)
  return importerLayer >= importeeLayer
}
```

### 2. Config updates

```javascript
export default [
  {
    files: ["src/**/*.ts"],
    plugins: {
      "@typescript-eslint": tseslint,
      local: {
        ...directoryEntryImport,
        ...layerDependency // new rule
      }
    },
    rules: {
      "local/require-directory-index-import": "error",
      "local/no-layer-violation": "error", // new rule
      "local/no-intra-layer-cycle": "warn"  // new rule
    }
  }
]
```

## Migration strategy

### Phase 1: immediate fixes ✅
- [x] Resolve immediate cycles (this PR)
- [x] Remove LayoutVariables re-export
- [x] Adopt dependency injection patterns

### Phase 2: rule expansion
- [ ] Implement layer-based ESLint rules
- [ ] Add dependency visualization tooling
- [ ] Enforce cycle checks in CI/CD

### Phase 3: architecture improvements
- [ ] Remove remaining cycles
- [ ] Clarify layer boundaries
- [ ] Improve documentation

## Operating rules

### 1. Review checklist
- [ ] When adding re-exports to index.ts, check for cycles
- [ ] Ensure constructors do not instantiate concrete classes directly
- [ ] Tests follow dependency injection patterns

### 2. New feature guidelines
- [ ] Respect layer placement
- [ ] Only depend from higher to lower layers
- [ ] Extract interfaces when appropriate

### 3. Refactoring guidance
- [ ] Use dependency injection to resolve cycles
- [ ] Re-exports only within same or lower layers
- [ ] Separate responsibilities to clarify layer boundaries

## Summary

This guideline aims to:

1. Prevent circular dependencies by design
2. Provide scalable, layer-based verification
3. Make dependency directions explicit
4. Shift from manual exceptions to structural rules

This helps maintain a healthy, maintainable codebase over time.

