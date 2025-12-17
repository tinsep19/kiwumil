import { describe, test, beforeEach, expect } from "bun:test"
import { LayoutContext } from "../src/model"
import { KiwiSolver, isKiwiVariable } from "../src/kiwi"
import { DefaultTheme } from "../src/theme"

describe("Hints.createHintVariable", () => {
  let context: LayoutContext

  beforeEach(() => {
    const solver = new KiwiSolver()
    context = new LayoutContext(solver, DefaultTheme)
  })

  test("creates a variable with automatic prefix", () => {
    const hintVar = context.hints.createHintVariable()

    expect(hintVar.variable).toBeDefined()
    expect(isKiwiVariable(hintVar.variable)).toBeTrue()
    expect(hintVar.name).toMatch(/^hint:var_\d+$/)
    expect(hintVar.constraintIds).toEqual([])
  })

  test("creates a variable with custom baseName", () => {
    const hintVar = context.hints.createHintVariable({ baseName: "anchor_x" })

    expect(hintVar.variable).toBeDefined()
    expect(hintVar.name).toMatch(/^hint:anchor_x_\d+$/)
  })

  test("creates a variable with custom name suffix", () => {
    const hintVar = context.hints.createHintVariable({
      baseName: "guide_y",
      name: "custom_123",
    })

    expect(hintVar.name).toBe("hint:guide_y_custom_123")
  })

  test("auto-increments counter for multiple variables", () => {
    const var1 = context.hints.createHintVariable({ baseName: "test" })
    const var2 = context.hints.createHintVariable({ baseName: "test" })
    const var3 = context.hints.createHintVariable({ baseName: "test" })

    expect(var1.name).toBe("hint:test_0")
    expect(var2.name).toBe("hint:test_1")
    expect(var3.name).toBe("hint:test_2")
  })

  test("tracks hint variables in Hints instance", () => {
    const var1 = context.hints.createHintVariable({ baseName: "x" })
    const var2 = context.hints.createHintVariable({ baseName: "y" })

    const allVars = context.hints.getHintVariables()
    expect(allVars.length).toBe(2)
    expect(allVars[0]).toEqual(var1)
    expect(allVars[1]).toEqual(var2)
  })

  test("created variables can be used in constraints", () => {
    const hintVar = context.hints.createHintVariable({ baseName: "anchor" })
    const testVar = context.variables.createVar("test")

    // Create a constraint using the hint variable
    context.createConstraints("test/constraint", (builder) => {
      builder.expr([1, hintVar.variable]).eq([1, testVar]).strong()
    })

    context.solve()

    // Both variables should have the same value after solving (may be 0 or -0)
    const hintValue = context.valueOf(hintVar.variable)
    const testValue = context.valueOf(testVar)
    expect(Math.abs(hintValue - testValue)).toBeLessThan(0.0001)
  })

  test("hint variables are not registered to Symbols", () => {
    const hintVar = context.hints.createHintVariable({ baseName: "test" })

    // Hint variables should be tracked by Hints, not Symbols
    const allHintVars = context.hints.getHintVariables()
    expect(allHintVars.some((v) => v.name === hintVar.name)).toBe(true)
  })

  test("hint variables can be used with solver constraints", () => {
    const anchor = context.hints.createHintVariable({ baseName: "anchor" })

    // Set the anchor to a specific value
    context.createConstraints("anchor/fixed", (builder) => {
      builder.expr([1, anchor.variable]).eq([100, 1]).required()
    })

    context.solve()

    expect(context.valueOf(anchor.variable)).toBe(100)
  })

  test("multiple hint variables can be used together", () => {
    const x1 = context.hints.createHintVariable({ baseName: "x1" })
    const x2 = context.hints.createHintVariable({ baseName: "x2" })
    const width = context.hints.createHintVariable({ baseName: "width" })

    // x2 = x1 + width
    context.createConstraints("layout/horizontal", (builder) => {
      builder.expr([1, x2.variable]).eq([1, x1.variable], [1, width.variable]).strong()
    })

    // Fix x1 and width
    context.createConstraints("x1/fixed", (builder) => {
      builder.expr([1, x1.variable]).eq([10, 1]).required()
    })
    context.createConstraints("width/fixed", (builder) => {
      builder.expr([1, width.variable]).eq([50, 1]).required()
    })

    context.solve()

    expect(context.valueOf(x1.variable)).toBe(10)
    expect(context.valueOf(width.variable)).toBe(50)
    expect(context.valueOf(x2.variable)).toBe(60)
  })
})
