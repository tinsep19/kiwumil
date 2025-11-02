
// examples/vertical_layout.ts
import { LayoutEngine } from "../src/core/layout_engine.ts"

const engine = new LayoutEngine()

const a = engine.addNode("a")
const b = engine.addNode("b")
const c = engine.addNode("c")

engine.anchorNode(a, 0, 0)
engine.addVerticalLayout([a, b, c], 50)

const result = engine.solve()
console.log(result)

