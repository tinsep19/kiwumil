import { describe, test, beforeEach, expect } from "bun:test"
import { LayoutContext, Symbols } from "@/model"
import { KiwiSolver } from "@/kiwi"
import { DefaultTheme } from "@/theme"
import { RectangleSymbol } from "@/plugin/core"
import {
  createArrangeHorizontalSpec,
  createArrangeVerticalSpec,
  createAlignLeftSpec,
  createAlignCenterXSpec,
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

  test("createArrangeHorizontalSpec should arrange symbols horizontally", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")
    const rect3 = createRectangle("rect3")

    const targets = [
      { boundId: rect1.bounds.boundId, bounds: rect1.bounds },
      { boundId: rect2.bounds.boundId, bounds: rect2.bounds },
      { boundId: rect3.bounds.boundId, bounds: rect3.bounds },
    ]

    context.hints.register("horizontal-layout", (builder) => {
      builder.setConstraint(createArrangeHorizontalSpec(targets, 20))
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

  test("createArrangeVerticalSpec should arrange symbols vertically", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")
    const rect3 = createRectangle("rect3")

    const targets = [
      { boundId: rect1.bounds.boundId, bounds: rect1.bounds },
      { boundId: rect2.bounds.boundId, bounds: rect2.bounds },
      { boundId: rect3.bounds.boundId, bounds: rect3.bounds },
    ]

    context.hints.register("vertical-layout", (builder) => {
      builder.setConstraint(createArrangeVerticalSpec(targets, 15))
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

  test("createAlignLeftSpec should align symbols to left edge", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")
    const rect3 = createRectangle("rect3")

    const targets = [
      { boundId: rect1.bounds.boundId, bounds: rect1.bounds },
      { boundId: rect2.bounds.boundId, bounds: rect2.bounds },
      { boundId: rect3.bounds.boundId, bounds: rect3.bounds },
    ]

    context.hints.register("left-align", (builder) => {
      builder.setConstraint(createAlignLeftSpec(targets))
      return builder.build()
    })

    context.solve()

    const x1 = context.valueOf(rect1.bounds.x)
    const x2 = context.valueOf(rect2.bounds.x)
    const x3 = context.valueOf(rect3.bounds.x)

    expect(x2).toBeCloseTo(x1, 1)
    expect(x3).toBeCloseTo(x1, 1)
  })

  test("should combine multiple specs in one constraint", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")
    const rect3 = createRectangle("rect3")

    const targets = [
      { boundId: rect1.bounds.boundId, bounds: rect1.bounds },
      { boundId: rect2.bounds.boundId, bounds: rect2.bounds },
      { boundId: rect3.bounds.boundId, bounds: rect3.bounds },
    ]

    context.hints.register("combined-layout", (builder) => {
      builder.setConstraint((cb) => {
        // Combine multiple constraint specs
        createArrangeVerticalSpec(targets, 10)(cb)
        createAlignCenterXSpec(targets)(cb)
      })
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
      builder.setConstraint(createAlignLeftSpec(targets))
      return builder.build()
    })

    // Should not throw
    context.solve()
  })
})
