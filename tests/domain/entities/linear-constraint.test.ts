import { describe, test, expect } from "bun:test"
import { LinearConstraint } from "@/domain/entities/linear-constraint"
import { Variable } from "@/domain/entities/variable"

describe("LinearConstraint", () => {
  test("should create a constraint with equality operator", () => {
    const x = new Variable("x")
    const constraint = new LinearConstraint(
      [[1, x]],
      [[42, 1]],
      "==",
      "required"
    )
    
    expect(constraint.op).toBe("==")
    expect(constraint.strength).toBe("required")
    expect(constraint.lhs).toHaveLength(1)
    expect(constraint.rhs).toHaveLength(1)
  })

  test("should create a constraint with less-than-or-equal operator", () => {
    const x = new Variable("x")
    const constraint = new LinearConstraint(
      [[1, x]],
      [[100, 1]],
      "<=",
      "strong"
    )
    
    expect(constraint.op).toBe("<=")
    expect(constraint.strength).toBe("strong")
  })

  test("should create a constraint with greater-than-or-equal operator", () => {
    const x = new Variable("x")
    const constraint = new LinearConstraint(
      [[1, x]],
      [[0, 1]],
      ">=",
      "medium"
    )
    
    expect(constraint.op).toBe(">=")
    expect(constraint.strength).toBe("medium")
  })

  test("should create a constraint with multiple terms on left side", () => {
    const x = new Variable("x")
    const y = new Variable("y")
    const constraint = new LinearConstraint(
      [[1, x], [1, y]],
      [[100, 1]],
      "==",
      "required"
    )
    
    expect(constraint.lhs).toHaveLength(2)
    expect(constraint.rhs).toHaveLength(1)
  })

  test("should create a constraint with multiple terms on right side", () => {
    const x = new Variable("x")
    const y = new Variable("y")
    const width = new Variable("width")
    const constraint = new LinearConstraint(
      [[1, width]],
      [[1, x], [1, y]],
      "==",
      "required"
    )
    
    expect(constraint.lhs).toHaveLength(1)
    expect(constraint.rhs).toHaveLength(2)
  })

  test("should handle constant terms", () => {
    const x = new Variable("x")
    const constraint = new LinearConstraint(
      [[1, x]],
      [[60, 1]],  // 60 * 1 = 60 (constant)
      "==",
      "required"
    )
    
    const [coefficient, operand] = constraint.rhs[0]!
    expect(coefficient).toBe(60)
    expect(operand).toBe(1)
  })

  test("should handle coefficients other than 1", () => {
    const x = new Variable("x")
    const constraint = new LinearConstraint(
      [[2, x]],  // 2 * x
      [[100, 1]],
      "==",
      "required"
    )
    
    const [coefficient] = constraint.lhs[0]!
    expect(coefficient).toBe(2)
  })

  test("should support all constraint strengths", () => {
    const x = new Variable("x")
    
    const required = new LinearConstraint([[1, x]], [[1, 1]], "==", "required")
    const strong = new LinearConstraint([[1, x]], [[1, 1]], "==", "strong")
    const medium = new LinearConstraint([[1, x]], [[1, 1]], "==", "medium")
    const weak = new LinearConstraint([[1, x]], [[1, 1]], "==", "weak")
    
    expect(required.strength).toBe("required")
    expect(strong.strength).toBe("strong")
    expect(medium.strength).toBe("medium")
    expect(weak.strength).toBe("weak")
  })
})
