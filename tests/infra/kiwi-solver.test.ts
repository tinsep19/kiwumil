import { describe, it, expect } from "bun:test"
import * as kiwi from "@lume/kiwi"
import { KiwiSolver } from "../../src/infra/solver/kiwi/kiwi-solver"
import type { FreeVariable } from "../../src/infra/solver/cassowary/types"

describe("KiwiSolver", () => {
  describe("createVariable", () => {
    it("should create FreeVariable without id", () => {
      const solver = new KiwiSolver()
      const freeVar = solver.createVariable("test")

      expect(freeVar.name()).toBe("test")
      expect(typeof freeVar.value()).toBe("number")
    })

    it("should create FreeVariable with default name", () => {
      const solver = new KiwiSolver()
      const freeVar = solver.createVariable()

      expect(freeVar.name()).toBe("anonymous")
    })
  })

  describe("type compatibility", () => {
    it("kiwi.Variable should satisfy FreeVariable", () => {
      const kiwiVar = new kiwi.Variable("test")
      const freeVar: FreeVariable = kiwiVar

      expect(freeVar.value()).toBeDefined()
      expect(freeVar.name()).toBe("test")
    })
  })

  describe("createConstraint", () => {
    it("should create constraints from spec", () => {
      const solver = new KiwiSolver()
      const x = solver.createVariable("x")

      const constraints = solver.createConstraint((builder) => {
        builder.ct([1, x]).eq([42, 1]).strong()
      })

      expect(constraints).toBeDefined()
      expect(Array.isArray(constraints)).toBe(true)
      expect(constraints.length).toBeGreaterThan(0)
    })
  })

  describe("updateVariables", () => {
    it("should solve constraints and update variables", () => {
      const solver = new KiwiSolver()
      const x = solver.createVariable("x")

      solver.createConstraint((builder) => {
        builder.ct([1, x]).eq([100, 1]).strong()
      })

      solver.updateVariables()

      expect(x.value()).toBeCloseTo(100)
    })
  })

  describe("createHandle", () => {
    it("should create suggest handle with strength", () => {
      const solver = new KiwiSolver()
      const variable = solver.createVariable("x")
      const handle = solver.createHandle(variable, "strong")

      expect(handle.strength()).toBe("strong")
    })

    it("should suggest values to variables", () => {
      const solver = new KiwiSolver()
      const variable = solver.createVariable("x")
      const handle = solver.createHandle(variable, "strong")

      handle.suggest(100)
      solver.updateVariables()

      expect(variable.value()).toBeCloseTo(100)

      handle.dispose()
    })

    it("should support all strength levels", () => {
      const solver = new KiwiSolver()
      const variable = solver.createVariable("x")

      const strengths: Array<"required" | "strong" | "medium" | "weak"> = [
        "strong",
        "medium",
        "weak",
      ]

      strengths.forEach((strength) => {
        const handle = solver.createHandle(variable, strength)
        expect(handle.strength()).toBe(strength)
        handle.dispose()
      })
    })
  })

  describe("convertStrength", () => {
    it("should throw error for unknown strength", () => {
      const solver = new KiwiSolver()
      const variable = solver.createVariable("x")

      expect(() => {
        solver.createHandle(variable, "invalid" as any)
      }).toThrow()
    })
  })
})
