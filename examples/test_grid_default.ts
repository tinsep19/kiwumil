import { TypeDiagram } from "../src/index"
import { CorePlugin } from "../src/plugin/core/plugin"

// FluentGridBuilder を使用した例（旧 GridBuilder は非推奨）
TypeDiagram("Grid Default Test")
  .use(CorePlugin)
  .build(({ el, rel, hint }) => {
    const a = el.core.rectangle("A")
    const b = el.core.rectangle("B")
    const c = el.core.rectangle("C")
    const d = el.core.rectangle("D")
    
    // 新しい FluentGridBuilder API - 2D配列で直接シンボルを指定
    hint.grid([
      [a, b],
      [c, d]
    ]).layout()
  })
  .render(import.meta)

