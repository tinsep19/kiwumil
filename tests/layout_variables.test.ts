import { LayoutVariables } from "../src/layout/layout_variables"
import { LayoutSolver, Operator } from "../src/layout/kiwi"

describe("LayoutVariables", () => {
  test("creates branded variables and solves equality constraints", () => {
    const vars = new LayoutVariables()
    const solver = new LayoutSolver()
    const x = vars.createVar("x")

    solver.addConstraint(x, Operator.Eq, 42)
    solver.updateVariables()

    expect(vars.valueOf(x)).toBeCloseTo(42)
  })

  test("supports expressions combining variables and constants", () => {
    const vars = new LayoutVariables()
    const solver = new LayoutSolver()
    const a = vars.createVar("a")
    const b = vars.createVar("b")

    solver.addConstraint(a, Operator.Eq, 10)
    solver.addConstraint(b, Operator.Eq, solver.expression([{ variable: a, coefficient: 1 }], 20))

    solver.updateVariables()

    expect(vars.valueOf(a)).toBeCloseTo(10)
    expect(vars.valueOf(b)).toBeCloseTo(30)
  })
})
