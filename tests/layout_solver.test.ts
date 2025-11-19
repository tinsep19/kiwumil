import { describe, test, beforeEach, expect } from "bun:test"
import { LayoutContext } from "../src/layout/layout_context"
import { ActorSymbol } from "../src/plugin/uml/symbols/actor_symbol"
import { UsecaseSymbol } from "../src/plugin/uml/symbols/usecase_symbol"
import { SystemBoundarySymbol } from "../src/plugin/uml/symbols/system_boundary_symbol"
import { DiagramSymbol } from "../src/model/diagram_symbol"
import { HintFactory } from "../src/dsl/hint_factory"
import { DefaultTheme } from "../src/core/theme"
import { toContainerSymbolId } from "../src/model/container_symbol_base"

describe("Layout pipeline", () => {
  let symbols: Array<DiagramSymbol | ActorSymbol | UsecaseSymbol | SystemBoundarySymbol>
  let layout: LayoutContext
  let hint: HintFactory

  beforeEach(() => {
    symbols = []
    layout = new LayoutContext(DefaultTheme, id => symbols.find(s => s.id === id))
    hint = new HintFactory(layout, symbols)
  })

  function createActor(id: string) {
    const actor = new ActorSymbol(id, id, layout.vars)
    layout.applyFixedSize(actor)
    symbols.push(actor)
    return actor
  }

  function createUsecase(id: string) {
    const usecase = new UsecaseSymbol(id, id, layout.vars)
    layout.applyFixedSize(usecase)
    symbols.push(usecase)
    return usecase
  }

  function createBoundary(id: string) {
    const boundary = new SystemBoundarySymbol(toContainerSymbolId(id), id, layout)
    symbols.push(boundary)
    return boundary
  }

  test("diagram symbol is anchored at the origin with minimum size", () => {
    const diagram = new DiagramSymbol(toContainerSymbolId("__diagram__"), "Test", layout)
    symbols.push(diagram)

    layout.solveAndApply(symbols)

    expect(diagram.bounds.x).toBeCloseTo(0)
    expect(diagram.bounds.y).toBeCloseTo(0)
    expect(diagram.bounds.width).toBeGreaterThanOrEqual(200)
    expect(diagram.bounds.height).toBeGreaterThanOrEqual(150)
  })

  test("arrangeHorizontal positions elements with default gap", () => {
    const a = createActor("a")
    const b = createActor("b")

    hint.arrangeHorizontal(a.id, b.id)
    layout.solveAndApply(symbols)

    expect(b.bounds.x).toBeCloseTo(a.bounds.x + a.bounds.width + DefaultTheme.defaultStyleSet.horizontalGap)
  })

  test("alignCenterY keeps elements on the same horizontal line", () => {
    const a = createActor("a")
    const b = createActor("b")
    const c = createUsecase("c")

    hint.arrangeHorizontal(a.id, b.id, c.id)
    hint.alignCenterY(a.id, b.id, c.id)
    layout.solveAndApply(symbols)

    expect(a.bounds.y + a.bounds.height / 2).toBeCloseTo(b.bounds.y + b.bounds.height / 2)
    expect(b.bounds.y + b.bounds.height / 2).toBeCloseTo(c.bounds.y + c.bounds.height / 2)
  })

  test("enclose keeps children inside container", () => {
    const boundary = createBoundary("boundary")
    const a = createActor("child-a")
    const b = createActor("child-b")

    hint.arrangeVertical(a.id, b.id)
    hint.enclose(toContainerSymbolId(boundary.id), [a.id, b.id])
    layout.solveAndApply(symbols)

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

    layout.solveAndApply(symbols)

    const guideValue = layout.valueOf(guide.y)
    expect(a.bounds.y).toBeCloseTo(guideValue)
    expect(b.bounds.y + b.bounds.height).toBeCloseTo(guideValue)
    expect(b.bounds.x).toBeCloseTo(a.bounds.x + a.bounds.width + DefaultTheme.defaultStyleSet.horizontalGap)
  })
})
