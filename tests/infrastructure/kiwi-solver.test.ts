import { describe, test, expect } from "bun:test"
import { KiwiSolver } from "@/infrastructure/kiwi-solver"
import { Variable } from "@/domain/entities/variable"
import { ct } from "@/dsl/constraint-dsl"

describe("KiwiSolver", () => {
  describe("addVariable and solve", () => {
    test("should add a variable and solve a simple constraint", () => {
      const solver = new KiwiSolver()
      const x = new Variable("x")
      
      solver.addVariable(x)
      solver.addConstraint(ct([1, x]).eq([42, 1]).required())
      solver.solve()
      
      expect(x.value()).toBeCloseTo(42, 5)
    })

    test("should handle multiple variables", () => {
      const solver = new KiwiSolver()
      const x = new Variable("x")
      const y = new Variable("y")
      
      solver.addVariable(x)
      solver.addVariable(y)
      solver.addConstraint(ct([1, x]).eq([10, 1]).required())
      solver.addConstraint(ct([1, y]).eq([20, 1]).required())
      solver.solve()
      
      expect(x.value()).toBeCloseTo(10, 5)
      expect(y.value()).toBeCloseTo(20, 5)
    })

    test("should not add the same variable twice", () => {
      const solver = new KiwiSolver()
      const x = new Variable("x")
      
      solver.addVariable(x)
      solver.addVariable(x)  // Should be ignored
      solver.addConstraint(ct([1, x]).eq([5, 1]).required())
      solver.solve()
      
      expect(x.value()).toBeCloseTo(5, 5)
    })
  })

  describe("constraint solving", () => {
    test("should solve constraint with addition", () => {
      const solver = new KiwiSolver()
      const x = new Variable("x")
      const width = new Variable("width")
      const right = new Variable("right")
      
      solver.addVariable(x)
      solver.addVariable(width)
      solver.addVariable(right)
      
      solver.addConstraint(ct([1, x]).eq([10, 1]).required())
      solver.addConstraint(ct([1, width]).eq([60, 1]).required())
      solver.addConstraint(ct([1, right]).eq([1, x], [1, width]).required())
      
      solver.solve()
      
      expect(x.value()).toBeCloseTo(10, 5)
      expect(width.value()).toBeCloseTo(60, 5)
      expect(right.value()).toBeCloseTo(70, 5)  // 10 + 60
    })

    test("should solve constraint with coefficients", () => {
      const solver = new KiwiSolver()
      const x = new Variable("x")
      
      solver.addVariable(x)
      solver.addConstraint(ct([2, x]).eq([100, 1]).required())
      solver.solve()
      
      expect(x.value()).toBeCloseTo(50, 5)  // 2x = 100, x = 50
    })

    test("should solve constraint with greater-than-or-equal", () => {
      const solver = new KiwiSolver()
      const x = new Variable("x")
      
      solver.addVariable(x)
      solver.addConstraint(ct([1, x]).ge([0, 1]).strong())
      solver.solve()
      
      expect(x.value()).toBeGreaterThanOrEqual(0)
    })

    test("should solve constraint with less-than-or-equal", () => {
      const solver = new KiwiSolver()
      const x = new Variable("x")
      
      solver.addVariable(x)
      solver.addConstraint(ct([1, x]).eq([50, 1]).strong())
      solver.addConstraint(ct([1, x]).le([100, 1]).required())
      solver.solve()
      
      expect(x.value()).toBeLessThanOrEqual(100)
    })
  })

  describe("constraint strengths", () => {
    test("should prioritize required constraints over strong", () => {
      const solver = new KiwiSolver()
      const x = new Variable("x")
      
      solver.addVariable(x)
      solver.addConstraint(ct([1, x]).eq([10, 1]).strong())
      solver.addConstraint(ct([1, x]).eq([20, 1]).required())
      solver.solve()
      
      expect(x.value()).toBeCloseTo(20, 5)
    })

    test("should handle conflicting weak constraints", () => {
      const solver = new KiwiSolver()
      const x = new Variable("x")
      
      solver.addVariable(x)
      solver.addConstraint(ct([1, x]).eq([10, 1]).weak())
      solver.addConstraint(ct([1, x]).eq([20, 1]).weak())
      solver.solve()
      
      // Should find a solution (may be between 10 and 20)
      expect(typeof x.value()).toBe("number")
      expect(Number.isFinite(x.value())).toBe(true)
    })
  })

  describe("removeConstraint", () => {
    test("should remove a constraint", () => {
      const solver = new KiwiSolver()
      const x = new Variable("x")
      
      solver.addVariable(x)
      const constraint = ct([1, x]).eq([42, 1]).required()
      solver.addConstraint(constraint)
      solver.solve()
      
      expect(x.value()).toBeCloseTo(42, 5)
      
      // Remove constraint and add a new one
      solver.removeConstraint(constraint)
      solver.addConstraint(ct([1, x]).eq([10, 1]).required())
      solver.solve()
      
      expect(x.value()).toBeCloseTo(10, 5)
    })
  })

  describe("error handling", () => {
    test("should throw error when adding constraint with unregistered variable", () => {
      const solver = new KiwiSolver()
      const x = new Variable("x")
      
      // Don't add variable to solver
      expect(() => {
        solver.addConstraint(ct([1, x]).eq([42, 1]).required())
      }).toThrow()
    })

    test("should not throw when adding the same constraint twice", () => {
      const solver = new KiwiSolver()
      const x = new Variable("x")
      
      solver.addVariable(x)
      const constraint = ct([1, x]).eq([42, 1]).required()
      solver.addConstraint(constraint)
      solver.addConstraint(constraint)  // Should be ignored
      solver.solve()
      
      expect(x.value()).toBeCloseTo(42, 5)
    })
  })

  describe("complex layout scenario", () => {
    test("should solve actor symbol constraints", () => {
      const solver = new KiwiSolver()
      
      const x = new Variable("actor.x")
      const y = new Variable("actor.y")
      const width = new Variable("actor.width")
      const height = new Variable("actor.height")
      const right = new Variable("actor.right")
      const bottom = new Variable("actor.bottom")
      
      // Add all variables
      solver.addVariable(x)
      solver.addVariable(y)
      solver.addVariable(width)
      solver.addVariable(height)
      solver.addVariable(right)
      solver.addVariable(bottom)
      
      // Add constraints
      solver.addConstraint(ct([1, x]).eq([10, 1]).strong())  // Suggested position
      solver.addConstraint(ct([1, y]).eq([20, 1]).strong())
      solver.addConstraint(ct([1, width]).eq([60, 1]).required())  // Fixed size
      solver.addConstraint(ct([1, height]).eq([80, 1]).required())
      solver.addConstraint(ct([1, right]).eq([1, x], [1, width]).required())
      solver.addConstraint(ct([1, bottom]).eq([1, y], [1, height]).required())
      
      solver.solve()
      
      expect(x.value()).toBeCloseTo(10, 5)
      expect(y.value()).toBeCloseTo(20, 5)
      expect(width.value()).toBeCloseTo(60, 5)
      expect(height.value()).toBeCloseTo(80, 5)
      expect(right.value()).toBeCloseTo(70, 5)  // 10 + 60
      expect(bottom.value()).toBeCloseTo(100, 5)  // 20 + 80
    })
  })
})
