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
})
