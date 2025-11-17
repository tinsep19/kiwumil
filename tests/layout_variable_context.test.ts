import { LayoutVariableContext, LayoutConstraintOperator } from "../src/layout/layout_variable_context"

describe("LayoutVariableContext", () => {
  test("creates branded variables and solves equality constraints", () => {
    const ctx = new LayoutVariableContext()
    const x = ctx.createVar("x")

    ctx.addConstraint(x, LayoutConstraintOperator.Eq, 42)
    ctx.solve()

    expect(ctx.valueOf(x)).toBeCloseTo(42)
  })

  test("supports expressions combining variables and constants", () => {
    const ctx = new LayoutVariableContext()
    const a = ctx.createVar("a")
    const b = ctx.createVar("b")

    ctx.addConstraint(a, LayoutConstraintOperator.Eq, 10)
    ctx.addConstraint(
      b,
      LayoutConstraintOperator.Eq,
      ctx.expression(
        [
          { variable: a, coefficient: 1 }
        ],
        20
      )
    )

    ctx.solve()

    expect(ctx.valueOf(a)).toBeCloseTo(10)
    expect(ctx.valueOf(b)).toBeCloseTo(30)
  })
})
