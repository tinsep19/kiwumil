import { LayoutVariables } from "../src/layout/layout_variables"
import { LayoutSolver } from "../src/layout/layout_solver"

describe("LayoutVariables", () => {
  test("creates branded variables and solves equality constraints", () => {
    const variables = new LayoutVariables()
    const solver = new LayoutSolver()
    const x = variables.createVar("x")

    const builder = solver.createConstraintsBuilder()
    builder.expr([1, x]).eq([42, 1]).strong()
    solver.updateVariables()

    expect(variables.valueOf(x)).toBeCloseTo(42)
  })

  test("supports expressions combining variables and constants", () => {
    const variables = new LayoutVariables()
    const solver = new LayoutSolver()
    const a = variables.createVar("a")
    const b = variables.createVar("b")

    const builder = solver.createConstraintsBuilder()
    builder.expr([1, a]).eq([10, 1]).strong()
    builder
      .expr([1, b])
      .eq([1, a], [20, 1])
      .strong()

    solver.updateVariables()

    expect(variables.valueOf(a)).toBeCloseTo(10)
    expect(variables.valueOf(b)).toBeCloseTo(30)
  })

  test("createBoundsSet creates multiple bounds with different types", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)

    const boundsSet = variables.createBoundsSet({
      symbol1: "layout",
      content1: "container",
      icon1: "item",
    })

    expect(boundsSet.symbol1).toBeDefined()
    expect(boundsSet.symbol1.type).toBe("layout")
    expect(boundsSet.symbol1.x).toBeDefined()
    expect(boundsSet.symbol1.y).toBeDefined()
    expect(boundsSet.symbol1.width).toBeDefined()
    expect(boundsSet.symbol1.height).toBeDefined()

    expect(boundsSet.content1).toBeDefined()
    expect(boundsSet.content1.type).toBe("container")

    expect(boundsSet.icon1).toBeDefined()
    expect(boundsSet.icon1.type).toBe("item")
  })

  test("createBoundsSet provides correct type inference", () => {
    const solver = new LayoutSolver()
    const variables = new LayoutVariables(solver)

    const boundsSet = variables.createBoundsSet({
      myLayout: "layout" as const,
      myContainer: "container" as const,
      myItem: "item" as const,
    })

    // TypeScript should infer the exact types based on BoundsMap
    // myLayout should be LayoutBounds, myContainer should be ContainerBounds, myItem should be ItemBounds
    expect(boundsSet.myLayout.type).toBe("layout")
    expect(boundsSet.myContainer.type).toBe("container")
    expect(boundsSet.myItem.type).toBe("item")
  })
})
