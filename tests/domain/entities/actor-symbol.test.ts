import { describe, test, expect } from "bun:test"
import { ActorSymbol } from "@/domain/entities/actor-symbol"
import { KiwiSolver } from "@/infrastructure/kiwi-solver"
import { SymbolFactory } from "@/infrastructure/symbol-factory"

describe("ActorSymbol", () => {
  describe("constructor", () => {
    test("should create an actor symbol with id and label", () => {
      const actor = new ActorSymbol("actor1", "User")
      
      expect(actor.id).toBe("actor1")
    })

    test("should create 6 variables", () => {
      const actor = new ActorSymbol("actor1", "User")
      const variables = actor.getVariables()
      
      expect(variables).toHaveLength(6)
    })

    test("should create 4 constraints", () => {
      const actor = new ActorSymbol("actor1", "User")
      const constraints = actor.getConstraints()
      
      expect(constraints).toHaveLength(4)
    })
  })

  describe("getVariables", () => {
    test("should return all variables", () => {
      const actor = new ActorSymbol("actor1", "User")
      const variables = actor.getVariables()
      
      const ids = variables.map((v) => v.id())
      expect(ids).toContain("actor1.x")
      expect(ids).toContain("actor1.y")
      expect(ids).toContain("actor1.width")
      expect(ids).toContain("actor1.height")
      expect(ids).toContain("actor1.right")
      expect(ids).toContain("actor1.bottom")
    })
  })

  describe("getConstraints", () => {
    test("should return readonly constraints", () => {
      const actor = new ActorSymbol("actor1", "User")
      const constraints = actor.getConstraints()
      
      expect(Array.isArray(constraints)).toBe(true)
    })

    test("should have constraints for width and height", () => {
      const actor = new ActorSymbol("actor1", "User")
      const constraints = actor.getConstraints()
      
      // Should have width = 60 and height = 80
      expect(constraints).toHaveLength(4)
      
      // All constraints should be required
      for (const constraint of constraints) {
        expect(constraint.strength).toBe("required")
      }
    })

    test("should have constraints for right and bottom", () => {
      const actor = new ActorSymbol("actor1", "User")
      const constraints = actor.getConstraints()
      
      // Check that right = x + width constraint exists
      const rightConstraint = constraints.find((c) => {
        return c.lhs.length === 1 && c.rhs.length === 2 && c.op === "=="
      })
      expect(rightConstraint).toBeDefined()
    })
  })

  describe("render", () => {
    test("should return SVG string", () => {
      const actor = new ActorSymbol("actor1", "User")
      const svg = actor.render()
      
      expect(typeof svg).toBe("string")
      expect(svg).toContain("<g")
      expect(svg).toContain("</g>")
      expect(svg).toContain("actor1")
      expect(svg).toContain("User")
    })

    test("should use calculated variable values", () => {
      const solver = new KiwiSolver()
      const actor = new ActorSymbol("actor1", "User")
      
      // Register variables and constraints
      for (const variable of actor.getVariables()) {
        solver.addVariable(variable)
      }
      for (const constraint of actor.getConstraints()) {
        solver.addConstraint(constraint)
      }
      
      solver.solve()
      
      const svg = actor.render()
      expect(svg).toContain("User")
    })
  })

  describe("integration with Solver", () => {
    test("should solve constraints correctly", () => {
      const solver = new KiwiSolver()
      const actor = new ActorSymbol("actor1", "User")
      
      // Register all variables
      for (const variable of actor.getVariables()) {
        solver.addVariable(variable)
      }
      
      // Register all constraints
      for (const constraint of actor.getConstraints()) {
        solver.addConstraint(constraint)
      }
      
      solver.solve()
      
      // Check that variables have expected values
      const variables = actor.getVariables()
      const width = variables.find((v) => v.id() === "actor1.width")
      const height = variables.find((v) => v.id() === "actor1.height")
      
      expect(width?.value()).toBeCloseTo(60, 5)
      expect(height?.value()).toBeCloseTo(80, 5)
    })

    test("should calculate right and bottom correctly", () => {
      const solver = new KiwiSolver()
      const factory = new SymbolFactory(solver)
      const actor = factory.createActor("actor1", "User")
      
      // Set position using ct DSL
      const variables = actor.getVariables()
      const x = variables.find((v) => v.id() === "actor1.x")
      const y = variables.find((v) => v.id() === "actor1.y")
      
      if (x && y) {
        const { ct } = require("@/dsl/constraint-dsl")
        solver.addConstraint(ct([1, x]).eq([10, 1]).strong())
        solver.addConstraint(ct([1, y]).eq([20, 1]).strong())
      }
      
      solver.solve()
      
      const right = variables.find((v) => v.id() === "actor1.right")
      const bottom = variables.find((v) => v.id() === "actor1.bottom")
      
      expect(right?.value()).toBeCloseTo(70, 5)  // 10 + 60
      expect(bottom?.value()).toBeCloseTo(100, 5)  // 20 + 80
    })
  })

  describe("with SymbolFactory", () => {
    test("should create actor through factory", () => {
      const solver = new KiwiSolver()
      const factory = new SymbolFactory(solver)
      
      const actor = factory.createActor("actor1", "User")
      
      expect(actor.id).toBe("actor1")
      expect(actor.getVariables()).toHaveLength(6)
      expect(actor.getConstraints()).toHaveLength(4)
    })

    test("should automatically register variables and constraints", () => {
      const solver = new KiwiSolver()
      const factory = new SymbolFactory(solver)
      
      const actor = factory.createActor("actor1", "User")
      
      // Should be able to solve immediately
      solver.solve()
      
      const variables = actor.getVariables()
      const width = variables.find((v) => v.id() === "actor1.width")
      
      expect(width?.value()).toBeCloseTo(60, 5)
    })

    test("should render correctly after solving", () => {
      const solver = new KiwiSolver()
      const factory = new SymbolFactory(solver)
      
      const actor = factory.createActor("actor1", "User")
      solver.solve()
      
      const svg = actor.render()
      expect(svg).toContain("User")
      expect(svg).toContain("actor1")
    })
  })
})
