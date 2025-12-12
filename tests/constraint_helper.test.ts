import { describe, test, expect } from "bun:test"
import { LayoutSolver } from "@/layout"
import { LayoutVariables } from "@/model"
import { ConstraintHelper } from "@/hint"
import type { LayoutBounds } from "@/core"

describe("ConstraintHelper", () => {
  function createTestBounds(variables: LayoutVariables, prefix: string): LayoutBounds {
    return variables.createBounds(prefix, "layout")
  }

  test("setSize should set width and height constraints", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)
    const bounds = createTestBounds(variables, "test")

    solver.createConstraint("test-setSize", (builder) => {
      const helper = new ConstraintHelper(builder)
      helper.setSize(bounds, 100, 50).strong()
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
      helper.enclose(container).childs(child).padding(10).required()
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

    solver.createConstraint("test-arrange", (builder) => {
      const helper = new ConstraintHelper(builder)
      helper.arrange(prev, next).margin(20).horizontal().medium()
    })

    solver.updateVariables()
    
    // next.x should be >= prev.x + prev.width + 20
    const expectedMinX = variables.valueOf(prev.x) + variables.valueOf(prev.width) + 20
    expect(variables.valueOf(next.x)).toBeGreaterThanOrEqual(expectedMinX - 0.01)
  })

  test("enclose should support multiple children", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)
    const container = createTestBounds(variables, "container")
    const child1 = createTestBounds(variables, "child1")
    const child2 = createTestBounds(variables, "child2")

    solver.createConstraint("test-container-size", (builder) => {
      builder.expr([1, container.width]).eq([200, 1]).strong()
      builder.expr([1, container.height]).eq([150, 1]).strong()
      builder.expr([1, container.x]).eq([0, 1]).strong()
      builder.expr([1, container.y]).eq([0, 1]).strong()
    })

    solver.createConstraint("test-children-size", (builder) => {
      builder.expr([1, child1.width]).eq([80, 1]).strong()
      builder.expr([1, child1.height]).eq([50, 1]).strong()
      builder.expr([1, child2.width]).eq([80, 1]).strong()
      builder.expr([1, child2.height]).eq([50, 1]).strong()
    })

    solver.createConstraint("test-enclose-multi", (builder) => {
      const helper = new ConstraintHelper(builder)
      helper.enclose(container).childs(child1, child2).padding(10).required()
    })

    solver.updateVariables()
    
    // Both children should be at least 10 pixels from container edges
    expect(variables.valueOf(child1.x)).toBeGreaterThanOrEqual(10)
    expect(variables.valueOf(child1.y)).toBeGreaterThanOrEqual(10)
    expect(variables.valueOf(child2.x)).toBeGreaterThanOrEqual(10)
    expect(variables.valueOf(child2.y)).toBeGreaterThanOrEqual(10)
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
      helper.align(bounds1.x, bounds2.x, bounds3.x).medium()
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
      helper.align(bounds.x).medium()
    })

    // Should not throw and solver should work normally
    solver.updateVariables()
    expect(true).toBe(true)
  })

  test("setSize with different strength levels", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)
    const bounds = createTestBounds(variables, "test")

    solver.createConstraint("test-setSize-weak", (builder) => {
      const helper = new ConstraintHelper(builder)
      helper.setSize(bounds, 100, 50).weak()
    })

    solver.updateVariables()
    expect(variables.valueOf(bounds.width)).toBeCloseTo(100)
    expect(variables.valueOf(bounds.height)).toBeCloseTo(50)
  })

  test("builder property should expose underlying IConstraintsBuilder", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)

    solver.createConstraint("test-builder-property", (builder) => {
      const helper = new ConstraintHelper(builder)
      expect(helper.builder).toBe(builder)
    })
  })

  test("usage example from comment should work", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)
    const container = createTestBounds(variables, "container")
    const child1 = createTestBounds(variables, "child1")
    const child2 = createTestBounds(variables, "child2")
    const layout = createTestBounds(variables, "layout")
    const item1 = createTestBounds(variables, "item1")
    const item2 = createTestBounds(variables, "item2")

    solver.createConstraint("test-usage-example", (builder) => {
      const helper = new ConstraintHelper(builder)
      
      helper.setSize(container, 200, 150).weak()
      helper.enclose(container).childs(child1, child2).padding(10).strong()
      helper.arrange(child1, child2).margin(20).horizontal().medium()
      helper.align(layout.x, container.x, item1.x, item2.x).required()
    })

    solver.updateVariables()
    // If no errors, the API works as expected
    expect(true).toBe(true)
  })

  test("arrange with multiple elements horizontal", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)
    const x1 = createTestBounds(variables, "x1")
    const x2 = createTestBounds(variables, "x2")
    const x3 = createTestBounds(variables, "x3")

    solver.createConstraint("test-x1", (builder) => {
      builder.expr([1, x1.x]).eq([0, 1]).strong()
      builder.expr([1, x1.width]).eq([50, 1]).strong()
    })

    solver.createConstraint("test-x2-width", (builder) => {
      builder.expr([1, x2.width]).eq([60, 1]).strong()
    })

    solver.createConstraint("test-arrange-multi", (builder) => {
      const helper = new ConstraintHelper(builder)
      helper.arrange(x1, x2, x3).margin(10).horizontal().medium()
    })

    solver.updateVariables()
    
    // x2.x should be >= x1.x + x1.width + 10 = 0 + 50 + 10 = 60
    expect(variables.valueOf(x2.x)).toBeGreaterThanOrEqual(60 - 0.01)
    // x3.x should be >= x2.x + x2.width + 10
    const expectedX3 = variables.valueOf(x2.x) + variables.valueOf(x2.width) + 10
    expect(variables.valueOf(x3.x)).toBeGreaterThanOrEqual(expectedX3 - 0.01)
  })

  test("arrange with multiple elements vertical", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)
    const x1 = createTestBounds(variables, "x1")
    const x2 = createTestBounds(variables, "x2")
    const x3 = createTestBounds(variables, "x3")

    solver.createConstraint("test-x1", (builder) => {
      builder.expr([1, x1.y]).eq([0, 1]).strong()
      builder.expr([1, x1.height]).eq([40, 1]).strong()
    })

    solver.createConstraint("test-x2-height", (builder) => {
      builder.expr([1, x2.height]).eq([50, 1]).strong()
    })

    solver.createConstraint("test-arrange-multi-vertical", (builder) => {
      const helper = new ConstraintHelper(builder)
      helper.arrange(x1, x2, x3).margin(15).vertical().medium()
    })

    solver.updateVariables()
    
    // x2.y should be >= x1.y + x1.height + 15 = 0 + 40 + 15 = 55
    expect(variables.valueOf(x2.y)).toBeGreaterThanOrEqual(55 - 0.01)
    // x3.y should be >= x2.y + x2.height + 15
    const expectedY3 = variables.valueOf(x2.y) + variables.valueOf(x2.height) + 15
    expect(variables.valueOf(x3.y)).toBeGreaterThanOrEqual(expectedY3 - 0.01)
  })
})
