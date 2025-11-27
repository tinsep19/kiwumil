import { SymbolBase } from "../src/model/symbol_base"
import { LayoutVariables } from "../src/layout/layout_variables"
import { LayoutSolver, Operator } from "../src/layout/kiwi"
import { LayoutConstraintBuilder } from "../src/layout/layout_constraints"
import type { Point } from "../src/model/types"
import type { LayoutBound } from "../src/layout/layout_bound"
import { DefaultTheme } from "../src/theme"

class DummySymbol extends SymbolBase {
  constructor(id: string, layoutBounds: LayoutBound) {
    super({ id, layoutBounds, theme: DefaultTheme })
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

class DummySymbolWithConstraints extends SymbolBase {
  constructor(id: string, layoutBounds: LayoutBound) {
    super({ id, layoutBounds, theme: DefaultTheme })
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

  protected override buildLayoutConstraints(builder: LayoutConstraintBuilder): void {
    // Add custom constraints - minimum size
    const bounds = this.getLayoutBounds()
    builder.ge(bounds.width, 20)
    builder.ge(bounds.height, 20)
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

  test("ensureLayoutBounds returns the same bounds", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const bounds = vars.createBound("dummy-3")
    const symbol = new DummySymbol("dummy-3", bounds)

    const ensuredBounds = symbol.ensureLayoutBounds()

    expect(ensuredBounds).toBe(bounds)
  })

  test("ensureLayoutBounds calls buildLayoutConstraints when builder is provided", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const bounds = vars.createBound("dummy-4")
    const symbol = new DummySymbolWithConstraints("dummy-4", bounds)
    const builder = new LayoutConstraintBuilder(solver)

    // Call ensureLayoutBounds with builder
    const ensuredBounds = symbol.ensureLayoutBounds(builder)

    // Verify it returns the same bounds
    expect(ensuredBounds).toBe(bounds)

    // Verify constraints were added by checking raw constraints
    const rawConstraints = builder.getRawConstraints()
    expect(rawConstraints.length).toBeGreaterThan(0)
  })
})
