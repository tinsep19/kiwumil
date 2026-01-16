import { describe, test, expect } from "bun:test"
import { ct } from "@/dsl/constraint-dsl"
import { Variable } from "@/domain/entities/variable"

describe("Constraint DSL", () => {
  describe("ct() entry point", () => {
    test("should create constraint with single term on left side", () => {
      const x = new Variable("x")
      const constraint = ct([1, x]).eq([42, 1]).required()
      
      expect(constraint.lhs).toHaveLength(1)
      expect(constraint.rhs).toHaveLength(1)
      expect(constraint.op).toBe("==")
      expect(constraint.strength).toBe("required")
    })

    test("should create constraint with multiple terms on left side", () => {
      const x = new Variable("x")
      const y = new Variable("y")
      const constraint = ct([1, x], [1, y]).eq([100, 1]).strong()
      
      expect(constraint.lhs).toHaveLength(2)
      expect(constraint.op).toBe("==")
      expect(constraint.strength).toBe("strong")
    })
  })

  describe("equality operators", () => {
    test("should create equality constraint with eq()", () => {
      const width = new Variable("width")
      const constraint = ct([1, width]).eq([60, 1]).required()
      
      expect(constraint.op).toBe("==")
    })

    test("should create equality constraint with eq0()", () => {
      const x = new Variable("x")
      const constraint = ct([1, x]).eq0().required()
      
      expect(constraint.op).toBe("==")
      expect(constraint.rhs).toHaveLength(1)
      expect(constraint.rhs[0]).toEqual([0, 1])
    })
  })

  describe("inequality operators", () => {
    test("should create greater-than-or-equal constraint with ge()", () => {
      const x = new Variable("x")
      const constraint = ct([1, x]).ge([0, 1]).required()
      
      expect(constraint.op).toBe(">=")
    })

    test("should create greater-than-or-equal constraint with ge0()", () => {
      const x = new Variable("x")
      const constraint = ct([1, x]).ge0().required()
      
      expect(constraint.op).toBe(">=")
      expect(constraint.rhs).toEqual([[0, 1]])
    })

    test("should create less-than-or-equal constraint with le()", () => {
      const x = new Variable("x")
      const constraint = ct([1, x]).le([100, 1]).required()
      
      expect(constraint.op).toBe("<=")
    })

    test("should create less-than-or-equal constraint with le0()", () => {
      const x = new Variable("x")
      const constraint = ct([1, x]).le0().required()
      
      expect(constraint.op).toBe("<=")
      expect(constraint.rhs).toEqual([[0, 1]])
    })
  })

  describe("constraint strengths", () => {
    test("should create required strength constraint", () => {
      const x = new Variable("x")
      const constraint = ct([1, x]).eq([10, 1]).required()
      
      expect(constraint.strength).toBe("required")
    })

    test("should create strong strength constraint", () => {
      const x = new Variable("x")
      const constraint = ct([1, x]).eq([10, 1]).strong()
      
      expect(constraint.strength).toBe("strong")
    })

    test("should create medium strength constraint", () => {
      const x = new Variable("x")
      const constraint = ct([1, x]).eq([10, 1]).medium()
      
      expect(constraint.strength).toBe("medium")
    })

    test("should create weak strength constraint", () => {
      const x = new Variable("x")
      const constraint = ct([1, x]).eq([10, 1]).weak()
      
      expect(constraint.strength).toBe("weak")
    })
  })

  describe("complex constraints", () => {
    test("should create constraint with right = left + constant", () => {
      const x = new Variable("x")
      const width = new Variable("width")
      const right = new Variable("right")
      
      const constraint = ct([1, right]).eq([1, x], [1, width]).required()
      
      expect(constraint.lhs).toHaveLength(1)
      expect(constraint.rhs).toHaveLength(2)
      expect(constraint.lhs[0]).toEqual([1, right])
      expect(constraint.rhs[0]).toEqual([1, x])
      expect(constraint.rhs[1]).toEqual([1, width])
    })

    test("should handle coefficients other than 1", () => {
      const x = new Variable("x")
      const constraint = ct([2, x]).eq([100, 1]).required()
      
      expect(constraint.lhs[0]).toEqual([2, x])
    })

    test("should create constraint combining variables and constants", () => {
      const x = new Variable("x")
      const y = new Variable("y")
      const constraint = ct([1, x], [2, y]).eq([50, 1], [1, x]).required()
      
      expect(constraint.lhs).toHaveLength(2)
      expect(constraint.rhs).toHaveLength(2)
    })
  })
})
