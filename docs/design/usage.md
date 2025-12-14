[日本語](usage.ja.md) | English

# Getting started — Usage

Kiwumil provides a namespace-based DSL to build diagrams with constraint-based layout hints. Example (TypeScript):

```typescript
import { TypeDiagram, UMLPlugin } from "kiwumil"

TypeDiagram("First Milestone")
  .use(UMLPlugin)
  .build(({ el, rel, hint }) => {
    const user = el.uml.actor("User")
    const login = el.uml.usecase("Login")

    rel.uml.associate(user, login)
    hint.arrangeVertical(user, login)
  })
  .render("output.svg")
```

For more examples see the `examples/` directory and the README.
