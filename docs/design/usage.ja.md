[English](usage.md) | 日本語

# 入門 — 使い方

Kiwumil は名前空間ベースの DSL で、制約ベースのレイアウトヒントを使って図を作成します。例（TypeScript）:

```typescript
import { TypeDiagram, UMLPlugin } from "kiwumil"

TypeDiagram("First Milestone")
  .use(UMLPlugin)
  .layout(({ el, rel, hint }) => {
    const user = el.uml.actor("User")
    const login = el.uml.usecase("Login")

    rel.uml.associate(user, login)
    hint.arrangeVertical(user, login)
  })
  .render("output.svg")
```

詳細は `examples/` ディレクトリと README を参照してください。
