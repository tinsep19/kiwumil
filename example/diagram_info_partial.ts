// example/diagram_info_partial.ts
import { Diagram, BlueTheme } from "../src/index"

// Example with only title and createdAt
Diagram({
  title: "Partial Metadata Example",
  createdAt: "2025-11-13"
})
  .theme(BlueTheme)
  .build((el, rel, hint) => {
    const a = el.circle("A")
    const b = el.circle("B")
    const c = el.circle("C")
    const d = el.circle("D")
    
    hint.arrangeHorizontal(a, b)
    hint.arrangeHorizontal(c, d)
    hint.arrangeVertical(a, c)
  })
  .render("example/diagram_info_partial.svg")
