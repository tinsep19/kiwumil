import { describe, test, beforeEach, expect } from "bun:test"
import { LayoutContext } from "../src/layout/layout_context"
import { ActorSymbol } from "../src/plugin/uml/symbols/actor_symbol"
import { UsecaseSymbol } from "../src/plugin/uml/symbols/usecase_symbol"
import { SystemBoundarySymbol } from "../src/plugin/uml/symbols/system_boundary_symbol"
import { DiagramSymbol } from "../src/model/diagram_symbol"
import { HintFactory } from "../src/dsl/hint_factory"
import { Symbols } from "../src/dsl/symbols"
import { DefaultTheme } from "../src/theme"
import { toContainerSymbolId } from "../src/model/container_symbol_base"

describe("Layout pipeline", () => {
  let symbols: Symbols
  let layout: LayoutContext
  let hint: HintFactory

  beforeEach(() => {
    symbols = new Symbols()
    layout = new LayoutContext(DefaultTheme, id => symbols.findById(id))
    hint = new HintFactory(layout, symbols)
  })

  function createActor(id: string) {
    return symbols.register("test", "actor", (symbolId) => {
      const bound = layout.variables.createBound(symbolId)
      const actor = new ActorSymbol(symbolId, id, bound)
      return actor
    })
  }

  function createUsecase(id: string) {
    return symbols.register("test", "usecase", (symbolId) => {
      const bound = layout.variables.createBound(symbolId)
      const usecase = new UsecaseSymbol(symbolId, id, bound)
      return usecase
    })
  }

  function createBoundary(id: string) {
    return symbols.register("test", "systemBoundary", (symbolId) => {
      const containerId = toContainerSymbolId(symbolId)
      return new SystemBoundarySymbol(containerId, id, layout)
    })
  }

  test("diagram symbol is anchored at the origin with minimum size", () => {
    const diagram = new DiagramSymbol(toContainerSymbolId("__diagram__"), "Test", layout)
    layout.solveAndApply([...symbols.getAll(), diagram])

    expect(diagram.bounds.x).toBeCloseTo(0)
    expect(diagram.bounds.y).toBeCloseTo(0)
    expect(diagram.bounds.width).toBeGreaterThanOrEqual(200)
    expect(diagram.bounds.height).toBeGreaterThanOrEqual(150)
  })

  test("arrangeHorizontal positions elements with default gap", () => {
    const a = createActor("a")
    const b = createActor("b")

    hint.arrangeHorizontal(a.id, b.id)
    layout.solveAndApply(symbols.getAll())

    expect(b.bounds.x).toBeCloseTo(a.bounds.x + a.bounds.width + DefaultTheme.defaultStyleSet.horizontalGap)
  })

  test("alignCenterY keeps elements on the same horizontal line", () => {
    const a = createActor("a")
    const b = createActor("b")
    const c = createUsecase("c")

    hint.arrangeHorizontal(a.id, b.id, c.id)
    hint.alignCenterY(a.id, b.id, c.id)
    layout.solveAndApply(symbols.getAll())

    expect(a.bounds.y + a.bounds.height / 2).toBeCloseTo(b.bounds.y + b.bounds.height / 2)
    expect(b.bounds.y + b.bounds.height / 2).toBeCloseTo(c.bounds.y + c.bounds.height / 2)
  })

  test("enclose keeps children inside container", () => {
    const boundary = createBoundary("boundary")
    const a = createActor("child-a")
    const b = createActor("child-b")

    hint.arrangeVertical(a.id, b.id)
    hint.enclose(toContainerSymbolId(boundary.id), [a.id, b.id])
    layout.solveAndApply(symbols.getAll())

    expect(a.bounds.x).toBeGreaterThanOrEqual(boundary.bounds.x)
    expect(b.bounds.y + b.bounds.height).toBeLessThanOrEqual(boundary.bounds.y + boundary.bounds.height)
  })

  test("guide builder aligns to shared variable and arranges symbols", () => {
    const a = createActor("top")
    const b = createActor("bottom")

    const guide = hint
      .createGuideY()
      .alignTop(a.id)
      .alignBottom(b.id)
      .arrange()

    layout.solveAndApply(symbols.getAll())

    const guideValue = layout.valueOf(guide.y)
    expect(a.bounds.y).toBeCloseTo(guideValue)
    expect(b.bounds.y + b.bounds.height).toBeCloseTo(guideValue)
    expect(b.bounds.x).toBeCloseTo(a.bounds.x + a.bounds.width + DefaultTheme.defaultStyleSet.horizontalGap)
  })
})
