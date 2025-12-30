import { describe, test, beforeEach, expect } from "bun:test"
import { LayoutContext } from "@/model"
import { KiwiSolver } from "@/kiwi"
import { DefaultTheme } from "@/theme"
import { HintFactory } from "@/dsl"
import { RectangleSymbol } from "@/plugin/core"

describe("HintFactory with Hints integration", () => {
  let context: LayoutContext
  let hint: HintFactory
  const diagramContainerId = "__diagram__"

  beforeEach(() => {
    const solver = new KiwiSolver()
    context = new LayoutContext(solver, DefaultTheme)
    
    // Create diagram container characs
    const diagramCharacs = {
      id: diagramContainerId,
      bounds: context.variables.createBounds(diagramContainerId, "layout"),
      container: context.variables.createBounds(`${diagramContainerId}.container`, "container"),
    }
    
    hint = new HintFactory({ context, diagramContainer: diagramCharacs })
  })

  function createRectangle(id: string) {
    return context.symbols.register("test", "rectangle", (symbolId, r) => {
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

  test("GuideBuilder creates hint variables through Hints", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")

    // Create a guide which should use Hints.createHintVariable internally
    const guideX = hint.guideX(100)
    guideX.alignLeft(rect1, rect2)

    context.solve()

    // Both rectangles should be aligned to the guide at x=100
    expect(context.valueOf(rect1.bounds.x)).toBeCloseTo(100, 1)
    expect(context.valueOf(rect2.bounds.x)).toBeCloseTo(100, 1)
  })

  test("Hint variables work with Symbol bounds", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")
    const rect3 = createRectangle("rect3")

    // Create guides for alignment
    const guideX = hint.guideX(50)
    const guideY = hint.guideY(200)

    // Align rectangles to guides
    guideX.alignLeft(rect1, rect2, rect3)
    guideY.alignTop(rect1, rect2, rect3)

    context.solve()

    // All rectangles should be at the guide positions
    expect(context.valueOf(rect1.bounds.x)).toBeCloseTo(50, 1)
    expect(context.valueOf(rect2.bounds.x)).toBeCloseTo(50, 1)
    expect(context.valueOf(rect3.bounds.x)).toBeCloseTo(50, 1)

    expect(context.valueOf(rect1.bounds.y)).toBeCloseTo(200, 1)
    expect(context.valueOf(rect2.bounds.y)).toBeCloseTo(200, 1)
    expect(context.valueOf(rect3.bounds.y)).toBeCloseTo(200, 1)
  })
})
