import { Diagram, CorePlugin } from "../src/index"

const result = Diagram
  .use(CorePlugin)
  .build("Debug Arrange", (el, rel, hint) => {
    const a = el.usecase("A")
    const b = el.usecase("B")
    const c = el.usecase("C")
    
    hint.arrangeVertical(a, b, c)
  })

console.log("\n=== Symbol Positions ===")
for (const symbol of result.symbols) {
  console.log(`${symbol.id} (${symbol.label}): y=${symbol.bounds?.y}, height=${symbol.bounds?.height}`)
}

result.render("example/debug_arrange.svg")
