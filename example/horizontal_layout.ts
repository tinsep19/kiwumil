
// examples/simple_usecase.ts
import { LayoutEngine } from "../src/core/layout_engine.ts"

const engine = new LayoutEngine()

const actor = engine.addNode("actor")
const usecase = engine.addNode("usecase")
engine.anchorNode(actor, 0, 0)
engine.addHorizontalLayout([actor, usecase], 80)

const result = engine.solve()
console.log(result)
