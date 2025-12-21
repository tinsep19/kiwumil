import { describe, test, beforeEach, expect } from "bun:test"
import { LayoutContext, Symbols } from "@/model"
import { KiwiSolver } from "@/kiwi"
import { DefaultTheme } from "@/theme"
import { HintFactory } from "@/dsl"
import { RectangleSymbol } from "@/plugin/core"

describe("HintFactory with Hints integration", () => {
  let context: LayoutContext
  let symbols: Symbols
  let hint: HintFactory
  const diagramContainerId = "__diagram__"

  beforeEach(() => {
    const solver = new KiwiSolver()
    context = new LayoutContext(solver, DefaultTheme)
    symbols = new Symbols(context.variables)
    hint = new HintFactory({ context, symbols, diagramContainer: diagramContainerId })
  })

  function createRectangle(id: string) {
    return symbols.register("test", "rectangle", (symbolId, r) => {
      const bound = r.createLayoutBounds("layout")
      const rect = new RectangleSymbol({
        id: symbolId,
        bounds: bound,
        label: id,
        theme: DefaultTheme,
      })
      r.setSymbol(rect)
      r.setCharacs({ id: symbolId, bounds: bound })
      r.setConstraint((builder) => {
        rect.ensureLayoutBounds(builder)
      })
      return r.build()
    }).symbol as RectangleSymbol
  }

  test("GuideBuilder creates hint variables through Hints", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")

    // Create a guide which should use Hints.createHintVariable internally
    const guideX = hint.createGuideX(100)
    guideX.alignLeft(rect1.id, rect2.id)

    context.solveAndApply([rect1, rect2])

    // Both rectangles should be aligned to the guide at x=100
    expect(context.valueOf(rect1.bounds.x)).toBeCloseTo(100, 1)
    expect(context.valueOf(rect2.bounds.x)).toBeCloseTo(100, 1)
  })

  test("Hints tracks variables created by GuideBuilder", () => {
    const initialVarCount = context.hints.getHintVariables().length

    hint.createGuideX()
    hint.createGuideY()

    const allHintVars = context.hints.getHintVariables()
    expect(allHintVars.length).toBe(initialVarCount + 2)

    // Check that variables have the correct prefix
    expect(allHintVars.every((v) => v.name.startsWith("hint:"))).toBe(true)
  })

  test("Multiple guides create separate hint variables", () => {
    const guide1 = hint.createGuideX()
    const guide2 = hint.createGuideX()
    const guide3 = hint.createGuideY()

    const allVars = context.hints.getHintVariables()

    // Each guide should create its own variable
    expect(allVars.length).toBeGreaterThanOrEqual(3)

    // Variables should have unique names
    const names = allVars.map((v) => v.name)
    const uniqueNames = new Set(names)
    expect(uniqueNames.size).toBe(names.length)
  })

  test("Hint variables work with Symbol bounds", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")
    const rect3 = createRectangle("rect3")

    // Create guides for alignment
    const guideX = hint.createGuideX(50)
    const guideY = hint.createGuideY(200)

    // Align rectangles to guides
    guideX.alignLeft(rect1.id, rect2.id, rect3.id)
    guideY.alignTop(rect1.id, rect2.id, rect3.id)

    context.solveAndApply([rect1, rect2, rect3])

    // All rectangles should be at the guide positions
    expect(context.valueOf(rect1.bounds.x)).toBeCloseTo(50, 1)
    expect(context.valueOf(rect2.bounds.x)).toBeCloseTo(50, 1)
    expect(context.valueOf(rect3.bounds.x)).toBeCloseTo(50, 1)

    expect(context.valueOf(rect1.bounds.y)).toBeCloseTo(200, 1)
    expect(context.valueOf(rect2.bounds.y)).toBeCloseTo(200, 1)
    expect(context.valueOf(rect3.bounds.y)).toBeCloseTo(200, 1)
  })

  test("Hint variables have proper naming convention", () => {
    const guideX = hint.createGuideX()
    const guideY = hint.createGuideY()

    const allVars = context.hints.getHintVariables()

    // Find the guide variables (filter by the guide_x/guide_y pattern)
    const guideVars = allVars.filter(
      (v) => v.name.includes("guide_x_") || v.name.includes("guide_y_")
    )

    expect(guideVars.length).toBeGreaterThanOrEqual(2)

    // Check naming pattern: hint:guide_{x|y}_{name}
    guideVars.forEach((v) => {
      expect(v.name).toMatch(/^hint:guide_(x|y)_/)
    })
  })

  test("createHintVariable can be used directly for custom anchors", () => {
    const rect1 = createRectangle("rect1")

    // Create custom anchor variable
    const anchor = context.hints.createHintVariable({
      baseName: "custom_anchor",
      name: "center_point",
    })

    expect(anchor.name).toBe("hint:custom_anchor_center_point")

    // Use the anchor in a constraint
    context.createConstraint("anchor/rect1", (builder) => {
      builder.ct([1, rect1.bounds.x]).eq([1, anchor.variable]).strong()
    })

    // Set anchor value
    context.createConstraint("anchor/value", (builder) => {
      builder.ct([1, anchor.variable]).eq([150, 1]).required()
    })

    context.solveAndApply([rect1])

    expect(context.valueOf(rect1.bounds.x)).toBeCloseTo(150, 1)
  })
})
