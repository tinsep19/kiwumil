[日本語](architecture.ja.md) | English

# Architecture Overview

Kiwumil is layered to avoid circular dependencies and to keep the codebase maintainable. The recommended layer structure is:

```
Layer 4: DSL        (dsl/)
   ↓
Layer 3: Plugins    (plugin/)
   ↓
Layer 2: Model      (model/, hint/)
   ↓
Layer 1: Core       (core/, kiwi/, theme/, icon/, utils/)
```

Rules:
- Higher layers may depend on lower layers, but lower layers must not depend on higher layers.
- Re-exports should be limited to same-directory or lower-layer items to avoid cycles.

See `docs/guidelines/circular-dependency-prevention.md` for the layer-based ESLint rule proposals and implementation guidance.
