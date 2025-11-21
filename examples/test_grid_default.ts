import { TypeDiagram } from "../src/index"
import { CorePlugin } from "../src/plugin/core/plugin"

// 引数なしの grid() のテスト
TypeDiagram("Grid Default Test")
  .use(CorePlugin)
  .build((el, rel, hint) => {
    const a = el.core.rectangle("A")
    const b = el.core.rectangle("B")
    const c = el.core.rectangle("C")
    const d = el.core.rectangle("D")
    
    // 引数なしで diagram 全体をレイアウト
    hint.grid()
      .enclose([
        [a, b],
        [c, d]
      ])
      .gap({ row: 20, col: 30 })
      .layout()
  })
  .render(import.meta)

