import { describe, test, beforeEach, expect } from "bun:test"
import { KiwiSolver, isKiwiLinearConstraints } from "@/kiwi"
import { createLayoutConstraintFactory } from "@/core"
import type { LinearConstraints, LayoutConstraint } from "@/core"

describe("LinearConstraints API", () => {
  let solver: KiwiSolver

  beforeEach(() => {
    solver = new KiwiSolver()
  })

  test("createConstraints returns LinearConstraints", () => {
    const x = solver.createVariable("x")
    const constraint = solver.createConstraints("test-constraint", (builder) => {
      builder.expr([1, x]).eq([100, 1]).required()
    })

    // Check that the constraint has the correct structure
    expect(constraint).toHaveProperty("id")
    expect(constraint).toHaveProperty("rawConstraints")
    expect(constraint.id).toBe("test-constraint")
    expect(constraint.rawConstraints).toBeInstanceOf(Array)
    expect(constraint.rawConstraints.length).toBeGreaterThan(0)
  })

  test("LinearConstraints has correct id type", () => {
    const x = solver.createVariable("x")
    const constraint: LinearConstraints = solver.createConstraints("test-id", (builder) => {
      builder.expr([1, x]).eq([50, 1]).strong()
    })

    expect(constraint.id).toBe("test-id")
  })

  test("KiwiLinearConstraints has Kiwi brand", () => {
    const x = solver.createVariable("x")
    const constraint = solver.createConstraints("branded-constraint", (builder) => {
      builder.expr([1, x]).eq([75, 1]).medium()
    })

    // Check that the constraint has the Kiwi brand
    expect(constraint).toHaveProperty("__kiwiConstraintBrand")
    expect(isKiwiLinearConstraints(constraint)).toBe(true)
  })

  test("isKiwiLinearConstraints correctly identifies KiwiLinearConstraints", () => {
    const x = solver.createVariable("x")
    const constraint = solver.createConstraints("kiwi-test", (builder) => {
      builder.expr([1, x]).ge([0, 1]).weak()
    })

    expect(isKiwiLinearConstraints(constraint)).toBe(true)
    expect(isKiwiLinearConstraints(null)).toBe(false)
    expect(isKiwiLinearConstraints(undefined)).toBe(false)
    expect(isKiwiLinearConstraints({})).toBe(false)
    expect(isKiwiLinearConstraints({ id: "fake", rawConstraints: [] })).toBe(false)
  })

  test("createLayoutConstraintFactory produces LayoutConstraint", () => {
    const factory = createLayoutConstraintFactory(solver.createConstraints.bind(solver))
    const x = solver.createVariable("x")
    
    const constraint: LayoutConstraint = factory.createConstraint("factory-test", (builder) => {
      builder.expr([1, x]).eq([200, 1]).medium()
    })

    expect(constraint.id).toBe("factory-test")
    expect(constraint.rawConstraints.length).toBeGreaterThan(0)
  })

  test("factory function works with LayoutConstraintId", () => {
    const factory = createLayoutConstraintFactory(solver.createConstraints.bind(solver))
    const x = solver.createVariable("x")
    const y = solver.createVariable("y")
    
    const constraint = factory.createConstraint("layout-constraint-id", (builder) => {
      builder.expr([1, y]).eq([1, x], [10, 1]).weak()
    })

    solver.updateVariables()
    
    expect(constraint.id).toBe("layout-constraint-id")
    expect(constraint.rawConstraints).toBeDefined()
  })

  test("multiple constraints can be created", () => {
    const x = solver.createVariable("x")
    const y = solver.createVariable("y")
    
    const constraint1 = solver.createConstraints("c1", (builder) => {
      builder.expr([1, x]).eq([100, 1]).required()
    })
    
    const constraint2 = solver.createConstraints("c2", (builder) => {
      builder.expr([1, y]).eq([1, x], [50, 1]).strong()
    })

    solver.updateVariables()
    
    expect(x.value()).toBeCloseTo(100)
    expect(y.value()).toBeCloseTo(150)
    expect(constraint1.rawConstraints.length).toBeGreaterThan(0)
    expect(constraint2.rawConstraints.length).toBeGreaterThan(0)
    expect(isKiwiLinearConstraints(constraint1)).toBe(true)
    expect(isKiwiLinearConstraints(constraint2)).toBe(true)
  })

  test("LinearConstraints can be used in collections", () => {
    const constraints: LinearConstraints[] = []
    const x = solver.createVariable("x")
    
    for (let i = 0; i < 3; i++) {
      const c = solver.createConstraints(`constraint-${i}`, (builder) => {
        builder.expr([1, x]).ge([i * 10, 1]).weak()
      })
      constraints.push(c)
    }

    expect(constraints).toHaveLength(3)
    expect(constraints[0]!.id).toBe("constraint-0")
    expect(constraints[1]!.id).toBe("constraint-1")
    expect(constraints[2]!.id).toBe("constraint-2")
    
    // All should be KiwiLinearConstraints
    constraints.forEach(c => {
      expect(isKiwiLinearConstraints(c)).toBe(true)
    })
  })
})
