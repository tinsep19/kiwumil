[日本語](architecture.ja.md) | English

# Architecture Overview

Kiwumil is layered to avoid circular dependencies:

- DSL layer (dsl/) — public builders and plugins
- Model layer (model/) — Symbol/Relationship core classes
- Solver layer (kiwi/) — constraint solver integration
- Render layer (render/) — SVG rendering

See `docs/design/layout-system.md`, `plugin-system.md` and other files for details.
