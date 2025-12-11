import { describe, test, expect } from "bun:test"
import { LayoutSolver, LayoutVariables } from "@/layout"
import { ConstraintHelper } from "@/constraint_helper"
import type { LayoutBounds } from "@/core"

describe("ConstraintHelper", () => {
  function createTestBounds(variables: LayoutVariables, prefix: string): LayoutBounds {
    return variables.createBounds(prefix, "layout")
  }

  test("setSize should set width and height constraints", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)
    const bounds = createTestBounds(variables, "test")

    const constraint = solver.createConstraint("test-setSize", (builder) => {
      const helper = new ConstraintHelper(builder)
      helper.setSize(bounds, 100, 50, "strong")
    })

    solver.updateVariables()
    expect(variables.valueOf(bounds.width)).toBeCloseTo(100)
    expect(variables.valueOf(bounds.height)).toBeCloseTo(50)
  })

  test("enclose should create padding constraints", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)
    const container = createTestBounds(variables, "container")
    const child = createTestBounds(variables, "child")

    solver.createConstraint("test-container-size", (builder) => {
      builder.expr([1, container.width]).eq([200, 1]).strong()
      builder.expr([1, container.height]).eq([150, 1]).strong()
      builder.expr([1, container.x]).eq([0, 1]).strong()
      builder.expr([1, container.y]).eq([0, 1]).strong()
    })

    solver.createConstraint("test-child-size", (builder) => {
      builder.expr([1, child.width]).eq([100, 1]).strong()
      builder.expr([1, child.height]).eq([60, 1]).strong()
    })

    solver.createConstraint("test-enclose", (builder) => {
      const helper = new ConstraintHelper(builder)
      helper.enclose(container, child, 10, "required")
    })

    solver.updateVariables()
    
    // child should be at least 10 pixels from container edges
    expect(variables.valueOf(child.x)).toBeGreaterThanOrEqual(10)
    expect(variables.valueOf(child.y)).toBeGreaterThanOrEqual(10)
  })

  test("arrange horizontal should create margin constraint", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)
    const prev = createTestBounds(variables, "prev")
    const next = createTestBounds(variables, "next")

    solver.createConstraint("test-prev", (builder) => {
      builder.expr([1, prev.x]).eq([0, 1]).strong()
      builder.expr([1, prev.width]).eq([50, 1]).strong()
    })

    solver.createConstraint("test-arrange-horizontal", (builder) => {
      const helper = new ConstraintHelper(builder)
      helper.arrange("horizontal", prev, next, 20, "medium")
    })

    solver.updateVariables()
    
    // next.x should be >= prev.x + prev.width + 20
    const expectedMinX = variables.valueOf(prev.x) + variables.valueOf(prev.width) + 20
    expect(variables.valueOf(next.x)).toBeGreaterThanOrEqual(expectedMinX - 0.01)
  })

  test("arrange vertical should create margin constraint", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)
    const prev = createTestBounds(variables, "prev")
    const next = createTestBounds(variables, "next")

    solver.createConstraint("test-prev", (builder) => {
      builder.expr([1, prev.y]).eq([0, 1]).strong()
      builder.expr([1, prev.height]).eq([40, 1]).strong()
    })

    solver.createConstraint("test-arrange-vertical", (builder) => {
      const helper = new ConstraintHelper(builder)
      helper.arrange("vertical", prev, next, 15, "medium")
    })

    solver.updateVariables()
    
    // next.y should be >= prev.y + prev.height + 15
    const expectedMinY = variables.valueOf(prev.y) + variables.valueOf(prev.height) + 15
    expect(variables.valueOf(next.y)).toBeGreaterThanOrEqual(expectedMinY - 0.01)
  })

  test("align should create equality constraints between variables", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)
    const bounds1 = createTestBounds(variables, "b1")
    const bounds2 = createTestBounds(variables, "b2")
    const bounds3 = createTestBounds(variables, "b3")

    solver.createConstraint("test-b1-x", (builder) => {
      builder.expr([1, bounds1.x]).eq([10, 1]).strong()
    })

    solver.createConstraint("test-align", (builder) => {
      const helper = new ConstraintHelper(builder)
      helper.align([bounds1.x, bounds2.x, bounds3.x], "medium")
    })

    solver.updateVariables()
    
    // All x values should be equal
    expect(variables.valueOf(bounds1.x)).toBeCloseTo(10)
    expect(variables.valueOf(bounds2.x)).toBeCloseTo(10)
    expect(variables.valueOf(bounds3.x)).toBeCloseTo(10)
  })

  test("align with single variable should not create constraints", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)
    const bounds = createTestBounds(variables, "test")

    solver.createConstraint("test-align-single", (builder) => {
      const helper = new ConstraintHelper(builder)
      helper.align([bounds.x], "medium")
    })

    // Should not throw and solver should work normally
    solver.updateVariables()
    expect(true).toBe(true)
  })

  test("methods should be chainable", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)
    const container = createTestBounds(variables, "container")
    const child1 = createTestBounds(variables, "child1")
    const child2 = createTestBounds(variables, "child2")

    solver.createConstraint("test-child-sizes", (builder) => {
      builder.expr([1, child1.width]).eq([80, 1]).strong()
      builder.expr([1, child1.height]).eq([50, 1]).strong()
      builder.expr([1, child2.width]).eq([80, 1]).strong()
      builder.expr([1, child2.height]).eq([50, 1]).strong()
    })

    let helperInstance: ConstraintHelper | null = null
    solver.createConstraint("test-chaining", (builder) => {
      const helper = new ConstraintHelper(builder)
      helperInstance = helper
      
      const result = helper
        .setSize(container, 200, 150)
        .enclose(container, child1, 10)
        .arrange("horizontal", child1, child2, 20)
        .align([child1.centerY, child2.centerY])

      expect(result).toBe(helper)
    })

    solver.updateVariables()
    expect(helperInstance).not.toBeNull()
  })

  test("builder property should expose underlying IConstraintsBuilder", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)

    solver.createConstraint("test-builder-property", (builder) => {
      const helper = new ConstraintHelper(builder)
      expect(helper.builder).toBe(builder)
    })
  })
})
