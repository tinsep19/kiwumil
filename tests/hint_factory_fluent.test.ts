import { describe, test, beforeEach, expect } from "bun:test"
import { LayoutContext, Symbols } from "@/model"
import { KiwiSolver } from "@/kiwi"
import { DefaultTheme } from "@/theme"
import { HintFactory } from "@/dsl"
import { RectangleSymbol } from "@/plugin/core"

describe("HintFactory Fluent API", () => {
  let context: LayoutContext
  let symbols: Symbols
  let hint: HintFactory
  const diagramContainerId = "__diagram__"

  beforeEach(() => {
    const solver = new KiwiSolver()
    context = new LayoutContext(solver, DefaultTheme)
    symbols = new Symbols(context.variables)
    
    // Create diagram container characs
    const diagramCharacs = {
      id: diagramContainerId,
      bounds: context.variables.createBounds(diagramContainerId, "layout"),
      container: context.variables.createBounds(`${diagramContainerId}.container`, "container"),
    }
    
    hint = new HintFactory({ context, symbols, diagramContainer: diagramCharacs })
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

  test("should support method chaining for alignment methods", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")
    const rect3 = createRectangle("rect3")

    // Test fluent API - all methods return this
    const result = hint
      .alignLeft(rect1.id, rect2.id, rect3.id)
      .arrangeVertical(rect1.id, rect2.id, rect3.id)
      .alignWidth(rect1.id, rect2.id, rect3.id)

    // Verify it returns the same HintFactory instance
    expect(result).toBe(hint)

    context.solve()

    // Verify constraints were applied correctly
    expect(context.valueOf(rect1.bounds.x)).toBeCloseTo(context.valueOf(rect2.bounds.x), 1)
    expect(context.valueOf(rect2.bounds.x)).toBeCloseTo(context.valueOf(rect3.bounds.x), 1)
    expect(context.valueOf(rect1.bounds.width)).toBeCloseTo(context.valueOf(rect2.bounds.width), 1)
  })

  test("should support method chaining for arrangement methods", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")
    const rect3 = createRectangle("rect3")

    // Test horizontal and vertical aliases
    const result = hint
      .horizontal(rect1.id, rect2.id)
      .vertical(rect1.id, rect3.id)

    expect(result).toBe(hint)

    context.solve()

    // Horizontal arrangement should position rect2 to the right of rect1
    expect(context.valueOf(rect2.bounds.x)).toBeGreaterThan(context.valueOf(rect1.bounds.x))
    // Vertical arrangement should position rect3 below rect1
    expect(context.valueOf(rect3.bounds.y)).toBeGreaterThan(context.valueOf(rect1.bounds.y))
  })

  test("should support method chaining for enclose", () => {
    const container = symbols.register("test", "container", (symbolId, r) => {
      const bound = r.createLayoutBounds("layout")
      const containerBound = r.createContainerBounds("container")
      const rect = new RectangleSymbol({
        id: symbolId,
        bounds: bound,
        label: "Container",
        theme: DefaultTheme,
      })
      r.setSymbol(rect)
      r.setCharacs({ id: symbolId, bounds: bound, container: containerBound })
      r.setConstraint((builder) => {
        rect.ensureLayoutBounds(builder)
      })
      return r.build()
    }).characs

    const child1 = createRectangle("child1")
    const child2 = createRectangle("child2")

    // Old API: enclose(container, [children]) - returns this for chaining
    const result = hint
      .enclose(container.id, [child1.id, child2.id])
      .alignCenterX(child1.id, child2.id)

    expect(result).toBe(hint)

    context.solve()

    // Verify alignment was applied
    expect(context.valueOf(child1.bounds.centerX)).toBeCloseTo(
      context.valueOf(child2.bounds.centerX),
      1
    )
  })

  test("should support fluent arrange API with vertical", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")
    const rect3 = createRectangle("rect3")

    // New fluent API: arrange(...).vertical()
    hint.arrange(rect1.id, rect2.id, rect3.id).vertical()

    context.solve()

    // Verify vertical arrangement
    expect(context.valueOf(rect2.bounds.y)).toBeGreaterThan(context.valueOf(rect1.bounds.y))
    expect(context.valueOf(rect3.bounds.y)).toBeGreaterThan(context.valueOf(rect2.bounds.y))
  })

  test("should support fluent arrange API with horizontal", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")
    const rect3 = createRectangle("rect3")

    // New fluent API: arrange(...).horizontal()
    hint.arrange(rect1.id, rect2.id, rect3.id).horizontal()

    context.solve()

    // Verify horizontal arrangement
    expect(context.valueOf(rect2.bounds.x)).toBeGreaterThan(context.valueOf(rect1.bounds.x))
    expect(context.valueOf(rect3.bounds.x)).toBeGreaterThan(context.valueOf(rect2.bounds.x))
  })

  test("should support fluent arrange API with custom margin", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")

    const customMargin = 50

    // New fluent API: arrange(...).margin(value).vertical()
    hint.arrange(rect1.id, rect2.id).margin(customMargin).vertical()

    context.solve()

    const gap = context.valueOf(rect2.bounds.y) - context.valueOf(rect1.bounds.bottom)
    expect(gap).toBeCloseTo(customMargin, 1)
  })

  test("should support complex fluent chains", () => {
    const rect1 = createRectangle("rect1")
    const rect2 = createRectangle("rect2")
    const rect3 = createRectangle("rect3")
    const rect4 = createRectangle("rect4")

    // Complex chain
    hint
      .arrangeHorizontal(rect1.id, rect2.id)
      .arrangeHorizontal(rect3.id, rect4.id)
      .alignTop(rect1.id, rect2.id)
      .alignTop(rect3.id, rect4.id)
      .alignSize(rect1.id, rect2.id, rect3.id, rect4.id)
      .alignCenterX(rect1.id, rect3.id)

    context.solve()

    // All rectangles should have same size
    expect(context.valueOf(rect1.bounds.width)).toBeCloseTo(context.valueOf(rect2.bounds.width), 1)
    expect(context.valueOf(rect1.bounds.width)).toBeCloseTo(context.valueOf(rect3.bounds.width), 1)
    expect(context.valueOf(rect1.bounds.height)).toBeCloseTo(context.valueOf(rect2.bounds.height), 1)

    // rect1 and rect3 should be centered
    expect(context.valueOf(rect1.bounds.centerX)).toBeCloseTo(
      context.valueOf(rect3.bounds.centerX),
      1
    )
  })
})
