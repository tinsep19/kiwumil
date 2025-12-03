import {
  ConstraintsBuilder,
  LayoutSolver,
  LayoutVariables,
} from "@/layout"
import * as kiwi from "@lume/kiwi"

describe("ConstraintsBuilder", () => {
  test("expr()/eq() with strong constraint keeps variables equal", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const x = vars.createVar("builder:x")
    const y = vars.createVar("builder:y")

    const constraint1 = solver.createConstraint("test-eq", (builder) => {
      builder.expr([1, x]).eq([1, y]).strong()
    })

    const constraint2 = solver.createConstraint("test-setter", (builder) => {
      builder.expr([1, y]).eq([100, 1]).strong()
    })
    solver.updateVariables()

    const raw = constraint1.rawConstraints
    expect(raw).toHaveLength(1)
    const constraint = raw[0]
    expect(constraint.op()).toBe(kiwi.Operator.Eq)
    expect(constraint.strength()).toBe(kiwi.Strength.strong)
    expect(vars.valueOf(x)).toBeCloseTo(vars.valueOf(y))
    expect(vars.valueOf(x)).toBeCloseTo(100)
  })

  test("eq0() makes expression equal zero", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const x = vars.createVar("builder:x-zero")

    const constraint = solver.createConstraint("test-eq0", (builder) => {
      builder.expr([1, x]).eq0().strong()
    })

    solver.updateVariables()

    const raw = constraint.rawConstraints
    expect(raw).toHaveLength(1)
    const constraintObj = raw[0]
    expect(constraintObj.op()).toBe(kiwi.Operator.Eq)
    expect(vars.valueOf(x)).toBeCloseTo(0)
  })

  test("expr(...).eq0() asserts equality between variables", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const x = vars.createVar("builder:x-eq0")
    const y = vars.createVar("builder:y-eq0")

    solver.createConstraint("test-eq0-vars", (builder) => {
      builder.expr([1, x], [-1, y]).eq0().strong()
    })

    solver.createConstraint("test-setter", (builder) => {
      builder.expr([1, x]).eq([42, 1]).strong()
    })
    solver.updateVariables()

    expect(vars.valueOf(y)).toBeCloseTo(vars.valueOf(x))
    expect(vars.valueOf(y)).toBeCloseTo(42)
  })

  test("expr(...).eq0() can solve 2x - 3y + 7 = 0", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const x = vars.createVar("builder:x-linear")
    const y = vars.createVar("builder:y-linear")

    solver.createConstraint("test-linear", (builder) => {
      builder.expr([2, x], [-3, y], [7, 1]).eq0().strong()
    })

    solver.createConstraint("test-setter", (builder) => {
      builder.expr([1, x]).eq([10, 1]).strong()
    })
    solver.updateVariables()

    expect(vars.valueOf(y)).toBeCloseTo((2 * 10 + 7) / 3)
  })
})
