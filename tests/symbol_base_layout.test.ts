import { SymbolBase } from "@/model"
import { LayoutVariables, LayoutSolver, ConstraintsBuilder, LayoutBounds } from "@/layout"
import type { Point } from "@/core/symbols"
import { DefaultTheme } from "@/theme"

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
    const bounds = vars.createBounds("dummy-1")
    const symbol = new DummySymbol("dummy-1", bounds)
    const symbolBounds = symbol.layout

    solver.createConstraint("test-init", (builder) => {
      builder.expr([1, symbolBounds.x]).eq([15, 1]).strong()
      builder.expr([1, symbolBounds.y]).eq([25, 1]).strong()
    })
    solver.updateVariables()

    expect(vars.valueOf(symbolBounds.x)).toBeCloseTo(15)
    expect(vars.valueOf(symbolBounds.y)).toBeCloseTo(25)
  })

  test("layout property returns the injected bounds", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const bounds = vars.createBounds("dummy-2")
    const symbol = new DummySymbol("dummy-2", bounds)

    expect(symbol.layout).toBe(bounds)
  })

  test("ensureLayoutBounds accepts a builder", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const bounds = vars.createBounds("dummy-3")
    const symbol = new DummySymbol("dummy-3", bounds)
    
    const constraint = solver.createConstraint("test-ensure", (builder) => {
      symbol.ensureLayoutBounds(builder)
    })

    const rawConstraints = constraint.rawConstraints
    expect(rawConstraints).toHaveLength(0)
  })

  test("ensureLayoutBounds runs custom constraints", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const bounds = vars.createBounds("dummy-4")
    const symbol = new DummySymbolWithConstraints("dummy-4", bounds)
    
    const constraint = solver.createConstraint("test-custom", (builder) => {
      symbol.ensureLayoutBounds(builder)
    })

    const rawConstraints = constraint.rawConstraints
    expect(rawConstraints.length).toBeGreaterThan(0)
  })
})
