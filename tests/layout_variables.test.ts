import { KiwiSolver, isKiwiVariable } from "@/kiwi"
import { LayoutVariables } from "@/model"

describe("LayoutVariables", () => {
  test("creates branded variables and solves equality constraints", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const x = variables.createVar("x")

    solver.createConstraint("test-eq", (builder) => {
      builder.ct([1, x]).eq([42, 1]).strong()
    })
    solver.updateVariables()

    expect(variables.valueOf(x)).toBeCloseTo(42)
  })

  test("supports expressions combining variables and constants", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const a = variables.createVar("a")
    const b = variables.createVar("b")

    solver.createConstraint("test-combined", (builder) => {
      builder.ct([1, a]).eq([10, 1]).strong()
      builder.ct([1, b]).eq([1, a], [20, 1]).strong()
    })

    solver.updateVariables()

    expect(variables.valueOf(a)).toBeCloseTo(10)
    expect(variables.valueOf(b)).toBeCloseTo(30)
  })

  test("createBoundsSet creates multiple bounds with different types", () => {
    const solver = new KiwiSolver()
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
    const solver = new KiwiSolver()
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

  test("createBoundsSet creates LayoutVar when value is 'variable'", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)

    const boundsSet = variables.createBoundsSet({
      content: "container" as const,
      foo: "variable" as const,
      item: "item" as const,
    })

    // content should be ContainerBounds
    expect(boundsSet.content).toBeDefined()
    expect(boundsSet.content.type).toBe("container")
    expect(boundsSet.content.x).toBeDefined()

    // foo should be LayoutVar (created via createVar)
    expect(boundsSet.foo).toBeDefined()
    expect(typeof boundsSet.foo.value).toBe("function")
    // LayoutVar should not have type, x, y, etc properties
    expect((boundsSet.foo as unknown as { type?: string }).type).toBeUndefined()

    // item should be ItemBounds
    expect(boundsSet.item).toBeDefined()
    expect(boundsSet.item.type).toBe("item")
  })

  test("createBoundsSet with variable supports constraint solving", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)

    const boundsSet = variables.createBoundsSet({
      myVar: "variable" as const,
      myBounds: "layout" as const,
    })

    // Set myVar to 100
    solver.createConstraint("test-var-set", (builder) => {
      builder.ct([1, boundsSet.myVar]).eq([100, 1]).strong()
    })
    solver.updateVariables()

    expect(variables.valueOf(boundsSet.myVar)).toBeCloseTo(100)
    expect(boundsSet.myBounds.type).toBe("layout")
  })

  test("createConstraintsBuilder returns a working ConstraintsBuilder", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const x = variables.createVar("x")

    // Use the new createConstraint method from solver
    solver.createConstraint("test-constraint", (builder) => {
      builder.ct([1, x]).eq([42, 1]).strong()
    })
    solver.updateVariables()

    expect(variables.valueOf(x)).toBeCloseTo(42)
  })

  test("isKiwiVariable correctly identifies branded variables", () => {
    const solver = new KiwiSolver()
    const variables = new LayoutVariables(solver)
    const x = variables.createVar("x")

    // Should return true for branded KiwiVariable
    expect(isKiwiVariable(x)).toBe(true)

    // Should return false for non-branded objects
    expect(isKiwiVariable(null)).toBe(false)
    expect(isKiwiVariable(undefined)).toBe(false)
    expect(isKiwiVariable(42)).toBe(false)
    expect(isKiwiVariable("string")).toBe(false)
    expect(isKiwiVariable({})).toBe(false)
    expect(isKiwiVariable({ id: "fake", value: () => 0 })).toBe(false)
  })
})
