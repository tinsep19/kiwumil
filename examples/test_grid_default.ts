import { TypeDiagram } from "../src/index"
import { CorePlugin } from "../src/plugin/core/plugin"

// grid() の基本的な使い方のテスト
TypeDiagram("Grid Default Test")
  .use(CorePlugin)
  .build(({ el, rel, hint }) => {
    const a = el.core.rectangle("A")
    const b = el.core.rectangle("B")
    const c = el.core.rectangle("C")
    const d = el.core.rectangle("D")
    
    // Pass symbols directly to grid() as a 2D matrix
    hint.grid([
      [a, b],
      [c, d]
    ]).layout()
  })
  .render(import.meta)

