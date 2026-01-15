import { describe, it, expect } from "vitest"
import { VariableImpl, isAnchorX, isWidth, isHeight } from "../../src/domain/entities/variable"
import type { Variable, AnchorX, Width } from "../../src/domain/entities/variable"
import { KiwiSolver } from "../../src/infra/solver/kiwi/kiwi-solver"

describe("Variable Discriminated Union", () => {
  describe("VariableImpl", () => {
    it("should create variable with correct discriminator", () => {
      const solver = new KiwiSolver()
      const freeVar = solver.createVariable("test")
      
      const variable = new VariableImpl("test-id", freeVar, "anchor_x")
      
      expect(variable.id).toBe("test-id")
      expect(variable.variableType).toBe("anchor_x")
      expect(variable.freeVariable).toBe(freeVar)
    })

    it("should delegate value() to freeVariable", () => {
      const solver = new KiwiSolver()
      const freeVar = solver.createVariable("x")
      
      solver.createConstraint((builder) => {
        builder.ct([1, freeVar]).eq([42, 1]).strong()
      })
      solver.updateVariables()
      
      const variable = new VariableImpl("x", freeVar, "anchor_x")
      expect(variable.value()).toBeCloseTo(42)
    })

    it("should delegate name() to freeVariable", () => {
      const solver = new KiwiSolver()
      const freeVar = solver.createVariable("myVariable")
      
      const variable = new VariableImpl("id", freeVar, "width")
      expect(variable.name()).toBe("myVariable")
    })
  })

  describe("Type Guards", () => {
    it("should correctly identify variable types", () => {
      const solver = new KiwiSolver()
      
      const anchorX = new VariableImpl("x", solver.createVariable("x"), "anchor_x") as AnchorX
      const width = new VariableImpl("w", solver.createVariable("w"), "width") as Width
      
      expect(isAnchorX(anchorX)).toBe(true)
      expect(isWidth(anchorX)).toBe(false)
      
      expect(isWidth(width)).toBe(true)
      expect(isAnchorX(width)).toBe(false)
    })
  })

  describe("Type Safety with Switch", () => {
    it("should maintain type safety in switch statements", () => {
      const solver = new KiwiSolver()
      
      const variables: Variable[] = [
        new VariableImpl("x", solver.createVariable("x"), "anchor_x"),
        new VariableImpl("y", solver.createVariable("y"), "anchor_y"),
        new VariableImpl("z", solver.createVariable("z"), "anchor_z"),
        new VariableImpl("w", solver.createVariable("w"), "width"),
        new VariableImpl("h", solver.createVariable("h"), "height"),
        new VariableImpl("g", solver.createVariable("g"), "generic"),
      ]

      variables.forEach(v => {
        switch (v.variableType) {
          case "anchor_x":
            expect(v.variableType).toBe("anchor_x")
            break
          case "anchor_y":
            expect(v.variableType).toBe("anchor_y")
            break
          case "anchor_z":
            expect(v.variableType).toBe("anchor_z")
            break
          case "width":
            expect(v.variableType).toBe("width")
            break
          case "height":
            expect(v.variableType).toBe("height")
            break
          case "generic":
            expect(v.variableType).toBe("generic")
            break
          default:
            // ✅ 網羅性チェック（すべてのケースを処理済み）
            const _exhaustive: never = v
            throw new Error(`Unhandled variable type: ${_exhaustive}`)
        }
      })
    })
  })
})
