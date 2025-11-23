import { LayoutVariables } from "../src/layout/layout_variables"
import { LayoutSolver, Operator } from "../src/layout/kiwi"

describe("LayoutVariables", () => {
  test("creates branded variables and solves equality constraints", () => {
    const vars = new LayoutVariables()
    const solver = new LayoutSolver()
    const x = vars.createVar("x")

    solver.addConstraint(x, Operator.Eq, 42)
    solver.updateVariables()

    expect(vars.valueOf(x)).toBeCloseTo(42)
  })

  test("supports expressions combining variables and constants", () => {
    const vars = new LayoutVariables()
    const solver = new LayoutSolver()
    const a = vars.createVar("a")
    const b = vars.createVar("b")

    solver.addConstraint(a, Operator.Eq, 10)
    solver.addConstraint(b, Operator.Eq, solver.expression([{ variable: a, coefficient: 1 }], 20))

    solver.updateVariables()

    expect(vars.valueOf(a)).toBeCloseTo(10)
    expect(vars.valueOf(b)).toBeCloseTo(30)
  })

  test("createBoundsSet creates multiple bounds with different types", () => {
    const solver = new LayoutSolver()
    const vars = new LayoutVariables(solver)

    const boundsSet = vars.createBoundsSet({
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
    const vars = new LayoutVariables(solver)

    const boundsSet = vars.createBoundsSet({
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
