import { describe, it, expect } from "vitest"
import { ConstraintFactory } from "../../../src/domain/services/constraint-factory"
import { KiwiSolver } from "../../../src/infra/solver/kiwi/kiwi-solver"
import { 
  isGeometricConstraint, 
  isLayoutHint, 
  isSymbolInternalConstraint 
} from "../../../src/domain/entities/layout-constraint"

describe("ConstraintFactory", () => {
  describe("createGeometric", () => {
    it("should create geometric constraint with required strength", () => {
      const solver = new KiwiSolver()
      const factory = new ConstraintFactory(solver)
      
      const x = solver.createVariable("x")
      
      const constraint = factory.createGeometric(
        "test-geometric",
        (builder) => builder.ct([1, x]).eq([10, 1]).required(),
        "Test geometric constraint"
      )
      
      expect(constraint.id).toBe("test-geometric")
      expect(constraint.category).toBe("geometric")
      expect(constraint.strength).toBe("required")
      expect(constraint.description).toBe("Test geometric constraint")
      expect(constraint.rawConstraints).toBeDefined()
      expect(isGeometricConstraint(constraint)).toBe(true)
    })
  })

  describe("createHint", () => {
    it("should create layout hint with strong strength", () => {
      const solver = new KiwiSolver()
      const factory = new ConstraintFactory(solver)
      
      const x = solver.createVariable("x")
      
      const hint = factory.createHint(
        "test-hint",
        (builder) => builder.ct([1, x]).eq([10, 1]).strong(),
        "strong",
        "arrange",
        "Test hint"
      )
      
      expect(hint.id).toBe("test-hint")
      expect(hint.category).toBe("hint")
      expect(hint.strength).toBe("strong")
      expect(hint.hintType).toBe("arrange")
      expect(hint.description).toBe("Test hint")
      expect(isLayoutHint(hint)).toBe(true)
    })

    it("should support all hint strengths", () => {
      const solver = new KiwiSolver()
      const factory = new ConstraintFactory(solver)
      
      const x = solver.createVariable("x")
      const strengths: Array<"strong" | "medium" | "weak"> = ["strong", "medium", "weak"]
      
      strengths.forEach(strength => {
        const hint = factory.createHint(
          `hint-${strength}`,
          (builder) => builder.ct([1, x]).eq([10, 1]).strong(),
          strength,
          "custom"
        )
        
        expect(hint.strength).toBe(strength)
      })
    })

    it("should support all hint types", () => {
      const solver = new KiwiSolver()
      const factory = new ConstraintFactory(solver)
      
      const x = solver.createVariable("x")
      const types: Array<"arrange" | "align" | "enclose" | "custom"> = 
        ["arrange", "align", "enclose", "custom"]
      
      types.forEach(hintType => {
        const hint = factory.createHint(
          `hint-${hintType}`,
          (builder) => builder.ct([1, x]).eq([10, 1]).strong(),
          "medium",
          hintType
        )
        
        expect(hint.hintType).toBe(hintType)
      })
    })
  })

  describe("createSymbolInternal", () => {
    it("should create symbol internal constraint", () => {
      const solver = new KiwiSolver()
      const factory = new ConstraintFactory(solver)
      
      const x = solver.createVariable("x")
      
      const constraint = factory.createSymbolInternal(
        "test-symbol-internal",
        "actor-1",
        (builder) => builder.ct([1, x]).eq([10, 1]).strong(),
        "strong",
        "Actor head position"
      )
      
      expect(constraint.id).toBe("test-symbol-internal")
      expect(constraint.category).toBe("symbol-internal")
      expect(constraint.strength).toBe("strong")
      expect(constraint.symbolId).toBe("actor-1")
      expect(constraint.description).toBe("Actor head position")
      expect(isSymbolInternalConstraint(constraint)).toBe(true)
    })
  })
})
