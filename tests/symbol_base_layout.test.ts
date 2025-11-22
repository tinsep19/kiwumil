import { SymbolBase } from "../src/model/symbol_base"
import { LayoutVariables } from "../src/layout/layout_variables"
import { LayoutSolver, Operator } from "../src/layout/kiwi"
import type { Point } from "../src/model/types"
import type { LayoutBound } from "../src/layout/layout_bound"

class DummySymbol extends SymbolBase {
  constructor(id: string, layoutBounds: LayoutBound) {
    super(id, "Dummy", layoutBounds)
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
  test("initializes layout bounds when provided via constructor", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const bounds = vars.createBound("dummy-1")
    const symbol = new DummySymbol("dummy-1", bounds)
    const symbolBounds = symbol.getLayoutBounds()

    solver.addConstraint(symbolBounds.x, Operator.Eq, 15)
    solver.addConstraint(symbolBounds.y, Operator.Eq, 25)
    solver.updateVariables()

    expect(vars.valueOf(symbolBounds.x)).toBeCloseTo(15)
    expect(vars.valueOf(symbolBounds.y)).toBeCloseTo(25)
  })

  test("getLayoutBounds returns the injected bounds", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const bounds = vars.createBound("dummy-2")
    const symbol = new DummySymbol("dummy-2", bounds)

    expect(symbol.getLayoutBounds()).toBe(bounds)
  })
})
