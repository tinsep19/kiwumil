import { SymbolBase } from "../src/model/symbol_base"
import { LayoutVariables } from "../src/layout/layout_variables"
import { LayoutSolver, Operator } from "../src/layout/layout_solver"
import { ConstraintsBuilder } from "../src/layout/constraints_builder"
import type { Point } from "../src/model/types"
import type { LayoutBounds } from "../src/layout/bounds"
import { DefaultTheme } from "../src/theme"

class DummySymbol extends SymbolBase {
  constructor(id: string, layout: LayoutBounds) {
    super({ id, layout, theme: DefaultTheme })
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

  ensureLayoutBounds(_builder: ConstraintsBuilder): void {
    // no custom constraints
  }
}

class DummySymbolWithConstraints extends SymbolBase {
  constructor(id: string, layout: LayoutBounds) {
    super({ id, layout, theme: DefaultTheme })
  }

  getDefaultSize() {
    return { width: 20, height: 20 }
  }

  toSVG() {
    return "<g></g>"
  }

  getConnectionPoint(from: Point): Point {
    return from
  }

  ensureLayoutBounds(builder: ConstraintsBuilder): void {
    const bounds = this.layout
    builder.expr([1, bounds.width]).ge([20, 1]).weak()
    builder.expr([1, bounds.height]).ge([20, 1]).weak()
  }
}

describe("SymbolBase layout bounds", () => {
  test("initializes layout bounds when provided via constructor", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const bounds = vars.createBound("dummy-1")
    const symbol = new DummySymbol("dummy-1", bounds)
    const symbolBounds = symbol.layout

    solver.addConstraint(symbolBounds.x, Operator.Eq, 15)
    solver.addConstraint(symbolBounds.y, Operator.Eq, 25)
    solver.updateVariables()

    expect(vars.valueOf(symbolBounds.x)).toBeCloseTo(15)
    expect(vars.valueOf(symbolBounds.y)).toBeCloseTo(25)
  })

  test("layout property returns the injected bounds", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const bounds = vars.createBound("dummy-2")
    const symbol = new DummySymbol("dummy-2", bounds)

    expect(symbol.layout).toBe(bounds)
  })

  test("ensureLayoutBounds accepts a builder", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const bounds = vars.createBound("dummy-3")
    const symbol = new DummySymbol("dummy-3", bounds)
    const builder = solver.createConstraintsBuilder()

    symbol.ensureLayoutBounds(builder)

    const rawConstraints = builder.getRawConstraints()
    expect(rawConstraints).toHaveLength(0)
  })

  test("ensureLayoutBounds runs custom constraints", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const bounds = vars.createBound("dummy-4")
    const symbol = new DummySymbolWithConstraints("dummy-4", bounds)
    const builder = solver.createConstraintsBuilder()

    symbol.ensureLayoutBounds(builder)

    const rawConstraints = builder.getRawConstraints()
    expect(rawConstraints.length).toBeGreaterThan(0)
  })
})
