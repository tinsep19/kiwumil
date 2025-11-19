import { SymbolBase } from "../src/model/symbol_base"
import { LayoutVariables, LayoutConstraintOperator } from "../src/layout/layout_variables"
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
    const ctx = new LayoutVariables()
    const symbol = new DummySymbol("dummy-1", ctx)
    const bounds = symbol.getLayoutBounds()

    ctx.addConstraint(bounds.x, LayoutConstraintOperator.Eq, 15)
    ctx.addConstraint(bounds.y, LayoutConstraintOperator.Eq, 25)
    ctx.solve()

    expect(ctx.valueOf(bounds.x)).toBeCloseTo(15)
    expect(ctx.valueOf(bounds.y)).toBeCloseTo(25)
  })

  test("throws when layout bounds are not initialized", () => {
    const symbol = new DummySymbol("dummy-2")

    expect(() => symbol.getLayoutBounds()).toThrow()
  })
})
