import { describe, test, beforeEach, expect } from "bun:test"
import { LayoutContext, Symbols } from "@/model"
import { KiwiSolver } from "@/kiwi"
import { DefaultTheme } from "@/theme"
import { RectangleSymbol } from "@/plugin/core"
import {
  createArrangeHorizontalConstraint,
  createArrangeVerticalConstraint,
  createAlignLeftConstraint,
  createAlignCenterXConstraint,
  createGuideValueConstraint,
} from "@/dsl"

describe("Hint Builder Helpers with UserHintRegistration", () => {
  let context: LayoutContext
  let symbols: Symbols

  beforeEach(() => {
    const solver = new KiwiSolver()
    context = new LayoutContext(solver, DefaultTheme)
    symbols = new Symbols(context.variables)
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
    }).characs
  }

  test("createArrangeHorizontalConstraint should arrange symbols horizontally", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")
    const rect3 = createRectangle("rect3")

    const targets = [
      { boundId: rect1.bounds.boundId, bounds: rect1.bounds },
      { boundId: rect2.bounds.boundId, bounds: rect2.bounds },
      { boundId: rect3.bounds.boundId, bounds: rect3.bounds },
    ]

    context.hints.register("horizontal-layout", (builder) => {
      createArrangeHorizontalConstraint(builder, targets, 20, "arrange/horizontal")
      return builder.build()
    })

    context.solve()

    const x1 = context.valueOf(rect1.bounds.x)
    const w1 = context.valueOf(rect1.bounds.width)
    const x2 = context.valueOf(rect2.bounds.x)
    const w2 = context.valueOf(rect2.bounds.width)
    const x3 = context.valueOf(rect3.bounds.x)

    expect(x2).toBeCloseTo(x1 + w1 + 20, 1)
    expect(x3).toBeCloseTo(x2 + w2 + 20, 1)
  })

  test("createArrangeVerticalConstraint should arrange symbols vertically", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")
    const rect3 = createRectangle("rect3")

    const targets = [
      { boundId: rect1.bounds.boundId, bounds: rect1.bounds },
      { boundId: rect2.bounds.boundId, bounds: rect2.bounds },
      { boundId: rect3.bounds.boundId, bounds: rect3.bounds },
    ]

    context.hints.register("vertical-layout", (builder) => {
      createArrangeVerticalConstraint(builder, targets, 15, "arrange/vertical")
      return builder.build()
    })

    context.solve()

    const y1 = context.valueOf(rect1.bounds.y)
    const h1 = context.valueOf(rect1.bounds.height)
    const y2 = context.valueOf(rect2.bounds.y)
    const h2 = context.valueOf(rect2.bounds.height)
    const y3 = context.valueOf(rect3.bounds.y)

    expect(y2).toBeCloseTo(y1 + h1 + 15, 1)
    expect(y3).toBeCloseTo(y2 + h2 + 15, 1)
  })

  test("createAlignLeftConstraint should align symbols to left edge", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")
    const rect3 = createRectangle("rect3")

    const targets = [
      { boundId: rect1.bounds.boundId, bounds: rect1.bounds },
      { boundId: rect2.bounds.boundId, bounds: rect2.bounds },
      { boundId: rect3.bounds.boundId, bounds: rect3.bounds },
    ]

    context.hints.register("left-align", (builder) => {
      createAlignLeftConstraint(builder, targets, "align/left")
      return builder.build()
    })

    context.solve()

    const x1 = context.valueOf(rect1.bounds.x)
    const x2 = context.valueOf(rect2.bounds.x)
    const x3 = context.valueOf(rect3.bounds.x)

    expect(x2).toBeCloseTo(x1, 1)
    expect(x3).toBeCloseTo(x1, 1)
  })

  test("createGuideValueConstraint should constrain guide to specific value", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")

    context.hints.register("guide-x-250", (builder) => {
      const guideX = builder.createHintVariable({ baseName: "guide_x", name: "main" })
      
      // Set guide to x=250
      createGuideValueConstraint(builder, guideX.variable, 250, "guide/value")
      
      // Align rectangles to guide
      const targets = [
        { boundId: rect1.bounds.boundId, bounds: rect1.bounds },
        { boundId: rect2.bounds.boundId, bounds: rect2.bounds },
      ]
      
      builder.createConstraint("guide/align", (cb) => {
        cb.ct([1, rect1.bounds.x]).eq([1, guideX.variable]).strong()
        cb.ct([1, rect2.bounds.x]).eq([1, guideX.variable]).strong()
      })

      return builder.build()
    })

    context.solve()

    expect(context.valueOf(rect1.bounds.x)).toBeCloseTo(250, 1)
    expect(context.valueOf(rect2.bounds.x)).toBeCloseTo(250, 1)
  })

  test("should combine multiple helper functions in one registration", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")
    const rect3 = createRectangle("rect3")

    const targets = [
      { boundId: rect1.bounds.boundId, bounds: rect1.bounds },
      { boundId: rect2.bounds.boundId, bounds: rect2.bounds },
      { boundId: rect3.bounds.boundId, bounds: rect3.bounds },
    ]

    context.hints.register("combined-layout", (builder) => {
      // Arrange vertically
      createArrangeVerticalConstraint(builder, targets, 10, "arrange/vert")
      // And align centers horizontally
      createAlignCenterXConstraint(builder, targets, "align/centerX")
      return builder.build()
    })

    context.solve()

    const y1 = context.valueOf(rect1.bounds.y)
    const h1 = context.valueOf(rect1.bounds.height)
    const y2 = context.valueOf(rect2.bounds.y)

    // Check vertical arrangement
    expect(y2).toBeCloseTo(y1 + h1 + 10, 1)

    // Check center alignment
    const cx1 = context.valueOf(rect1.bounds.x) + context.valueOf(rect1.bounds.width) / 2
    const cx2 = context.valueOf(rect2.bounds.x) + context.valueOf(rect2.bounds.width) / 2
    const cx3 = context.valueOf(rect3.bounds.x) + context.valueOf(rect3.bounds.width) / 2

    expect(cx2).toBeCloseTo(cx1, 1)
    expect(cx3).toBeCloseTo(cx1, 1)
  })

  test("helper functions should work with empty targets gracefully", () => {
    const targets: any[] = []

    context.hints.register("empty-targets", (builder) => {
      const result = createAlignLeftConstraint(builder, targets, "align/left")
      expect(result).toBeNull()
      return builder.build()
    })

    // Should not throw
    context.solve()
  })
})
