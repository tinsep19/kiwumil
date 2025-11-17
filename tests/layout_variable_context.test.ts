import * as kiwi from "@lume/kiwi"
import { LayoutVariableContext } from "../src/layout/layout_variable_context"

describe("LayoutVariableContext", () => {
  test("creates branded variables and solves equality constraints", () => {
    const ctx = new LayoutVariableContext()
    const x = ctx.createVar("x")

    ctx.addConstraint(x, kiwi.Operator.Eq, 42)
    ctx.solve()

    expect(ctx.valueOf(x)).toBeCloseTo(42)
  })

  test("supports expressions combining variables and constants", () => {
    const ctx = new LayoutVariableContext()
    const a = ctx.createVar("a")
    const b = ctx.createVar("b")

    ctx.addConstraint(a, kiwi.Operator.Eq, 10)
    ctx.addConstraint(
      b,
      kiwi.Operator.Eq,
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
