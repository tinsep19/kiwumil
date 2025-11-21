import { SymbolBase } from "../src/model/symbol_base"
import { LayoutVariables } from "../src/layout/layout_variables"
import { LayoutSolver, Operator } from "../src/layout/kiwi"
import type { Point } from "../src/model/types"

class DummySymbol extends SymbolBase {
  constructor(id: string, layoutContext?: LayoutVariables) {
    super(id, "Dummy", layoutContext)
  }

  getDefaultSize() {
    return { width: 10, height: 10 }
  }

  toSVG() {
    return "<g></g>"
  }

  getConnectionPoint(from: Point): Point {
    return from
  }
}

describe("SymbolBase layout bounds", () => {
  test("initializes layout bounds when context is provided", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const symbol = new DummySymbol("dummy-1", vars)
    const bounds = symbol.getLayoutBounds()

    solver.addConstraint(bounds.x, Operator.Eq, 15)
    solver.addConstraint(bounds.y, Operator.Eq, 25)
    solver.updateVariables()

    expect(vars.valueOf(bounds.x)).toBeCloseTo(15)
    expect(vars.valueOf(bounds.y)).toBeCloseTo(25)
  })

  test("throws when layout bounds are not initialized", () => {
    const symbol = new DummySymbol("dummy-2")

    expect(() => symbol.getLayoutBounds()).toThrow()
  })
})
