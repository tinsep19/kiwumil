import { describe, test, expect } from "bun:test"
import { ConstraintExprBuilder } from "@/domain/ports/solver"

describe("ConstraintExprBuilder", () => {
  test("builds expected constraint expressions", () => {
    const builder = new ConstraintExprBuilder()
    const expr = builder
      .ct([1, 10], [2, 20])
      .eq([3, 30])
      .medium()

    expect(expr).toEqual({
      lhs: [
        [1, 10],
        [2, 20],
      ],
      rhs: [[3, 30]],
      op: "eq",
      strength: "medium",
    })

    const secondExpr = builder.ct([4, 40]).ge([5, 50]).weak()
    expect(secondExpr).toEqual({
      lhs: [[4, 40]],
      rhs: [[5, 50]],
      op: "ge",
      strength: "weak",
    })
  })

  test("supports zero-sided shortcuts", () => {
    const builder = new ConstraintExprBuilder()
    const eq0Expr = builder.ct([1, 10]).eq0().required()
    expect(eq0Expr.rhs).toEqual([[0, 1]])
    expect(eq0Expr.op).toBe("eq")
    expect(eq0Expr.strength).toBe("required")

    const le0Expr = builder.ct([2, 20]).le0().strong()
    expect(le0Expr.op).toBe("le")
    expect(le0Expr.rhs).toEqual([[0, 1]])

    const ge0Expr = builder.ct([3, 30]).ge0().strong()
    expect(ge0Expr.op).toBe("ge")
    expect(ge0Expr.rhs).toEqual([[0, 1]])
  })

  test("throws when required is called before rhs is set", () => {
    const builder = new ConstraintExprBuilder()
    expect(() => {
      builder.ct([1, 10]).required()
    }).toThrow("pending expr is not complete!")
  })
})
