import { Diagram, CorePlugin } from "../src/index"

const result = Diagram
  .use(CorePlugin)
  .build("Debug Pack+Arrange", (el, rel, hint) => {
    const a = el.usecase("A")
    const b = el.usecase("B")
    const c = el.usecase("C")
    const boundary = el.systemBoundary("Container")
    
    hint.pack(boundary, [a, b, c])
    hint.arrangeVertical(a, b, c)
  })

console.log("\n=== Symbol Positions ===")
for (const symbol of result.symbols) {
  console.log(`${symbol.id} (${symbol.label}): x=${symbol.bounds?.x}, y=${symbol.bounds?.y}, w=${symbol.bounds?.width}, h=${symbol.bounds?.height}`)
}

result.render("example/debug_pack_arrange.svg")
