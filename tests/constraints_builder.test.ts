import { ConstraintsBuilder } from "../src/layout/layout_constraints"
import { LayoutSolver, Operator, Strength } from "../src/layout/layout_solver"
import { LayoutVariables } from "../src/layout/layout_variables"

describe("ConstraintsBuilder", () => {
  test("expr()/eq() with strong constraint keeps variables equal", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const x = vars.createVar("builder:x")
    const y = vars.createVar("builder:y")

    const builder = new ConstraintsBuilder(solver.getInternalSolver())
    builder.expr([1, x]).eq([1, y]).strong()

    solver.addConstraint(y, Operator.Eq, 100)
    solver.updateVariables()

    const raw = builder.getRawConstraints()
    expect(raw).toHaveLength(1)
    const constraint = raw[0]
    expect(constraint.op()).toBe(Operator.Eq)
    expect(constraint.strength()).toBe(Strength.Strong)
    expect(vars.valueOf(x)).toBeCloseTo(vars.valueOf(y))
    expect(vars.valueOf(x)).toBeCloseTo(100)
  })

  test("eq0() makes expression equal zero", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const x = vars.createVar("builder:x-zero")

    const builder = new ConstraintsBuilder(solver.getInternalSolver())
    builder.expr([1, x]).eq0().strong()

    solver.updateVariables()

    const raw = builder.getRawConstraints()
    expect(raw).toHaveLength(1)
    const constraint = raw[0]
    expect(constraint.op()).toBe(Operator.Eq)
    expect(vars.valueOf(x)).toBeCloseTo(0)
  })

  test("expr(...).eq0() asserts equality between variables", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)
    const x = vars.createVar("builder:x-eq0")
    const y = vars.createVar("builder:y-eq0")

    const builder = new ConstraintsBuilder(solver.getInternalSolver())
    builder.expr([1, x], [-1, y]).eq0().strong()

    solver.addConstraint(x, Operator.Eq, 42)
    solver.updateVariables()

    expect(vars.valueOf(y)).toBeCloseTo(vars.valueOf(x))
    expect(vars.valueOf(y)).toBeCloseTo(42)
  })
})
