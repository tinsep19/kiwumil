import { describe, test, beforeEach, expect } from "bun:test"
import { LayoutContext } from "../src/layout/layout_context"
import { ActorSymbol } from "../src/plugin/uml/symbols/actor_symbol"
import { UsecaseSymbol } from "../src/plugin/uml/symbols/usecase_symbol"
import { SystemBoundarySymbol } from "../src/plugin/uml/symbols/system_boundary_symbol"
import { DiagramSymbol } from "../src/model/diagram_symbol"
import { HintFactory } from "../src/dsl/hint_factory"
import { Symbols } from "../src/dsl/symbols"
import { DefaultTheme } from "../src/theme"
import { toContainerSymbolId } from "../src/model/container_symbol"
import { getBoundsValues } from "../src/layout/bounds"

describe("Layout pipeline", () => {
  let symbols: Symbols
  let context: LayoutContext
  let hint: HintFactory

  beforeEach(() => {
    symbols = new Symbols()
    context = new LayoutContext(DefaultTheme, (id) => symbols.findById(id))
    hint = new HintFactory(context, symbols)
  })

  function createActor(id: string) {
    return symbols.register("test", "actor", (symbolId) => {
      const bound = context.variables.createBound(symbolId)
      const actor = new ActorSymbol({
        id: symbolId,
        layout: bound,
        label: id,
        theme: DefaultTheme,
      })
      return actor
    })
  }

  function createUsecase(id: string) {
    return symbols.register("test", "usecase", (symbolId) => {
      const bound = context.variables.createBound(symbolId)
      const usecase = new UsecaseSymbol({
        id: symbolId,
        layout: bound,
        label: id,
        theme: DefaultTheme,
      })
      return usecase
    })
  }

  function createBoundary(id: string) {
    return symbols.register("test", "systemBoundary", (symbolId) => {
      const containerId = toContainerSymbolId(symbolId)
      const bound = context.variables.createBound(containerId)
      return new SystemBoundarySymbol(
        {
          id: containerId,
          layout: bound,
          label: id,
          theme: DefaultTheme,
        },
        context
      )
    })
  }

  test("diagram symbol is anchored at the origin with minimum size", () => {
    const diagramId = toContainerSymbolId("__diagram__")
    const diagramBound = context.variables.createBound(diagramId)
    const diagramContainer = context.variables.createBound(`${diagramId}.container`, "container")
    const diagram = new DiagramSymbol(
      {
        id: diagramId,
        layout: diagramBound,
        container: diagramContainer,
        info: { title: "Test" },
        theme: DefaultTheme,
      },
      context
    )
    context.solveAndApply([...symbols.getAll(), diagram])

    const bounds = getBoundsValues(diagram.layout)
    expect(bounds.x).toBeCloseTo(0)
    expect(bounds.y).toBeCloseTo(0)
    expect(bounds.width).toBeGreaterThanOrEqual(200)
    expect(bounds.height).toBeGreaterThanOrEqual(150)
  })

  test("arrangeHorizontal positions elements with default gap", () => {
    const a = createActor("a")
    const b = createActor("b")

    hint.arrangeHorizontal(a.id, b.id)
    context.solveAndApply(symbols.getAll())

    const aBounds = getBoundsValues(a.layout)
    const bBounds = getBoundsValues(b.layout)
    expect(bBounds.x).toBeCloseTo(
      aBounds.x + aBounds.width + DefaultTheme.defaultStyleSet.horizontalGap
    )
  })

  test("alignCenterY keeps elements on the same horizontal line", () => {
    const a = createActor("a")
    const b = createActor("b")
    const c = createUsecase("c")

    hint.arrangeHorizontal(a.id, b.id, c.id)
    hint.alignCenterY(a.id, b.id, c.id)
    context.solveAndApply(symbols.getAll())

    const aBounds = getBoundsValues(a.layout)
    const bBounds = getBoundsValues(b.layout)
    const cBounds = getBoundsValues(c.layout)
    expect(aBounds.y + aBounds.height / 2).toBeCloseTo(bBounds.y + bBounds.height / 2)
    expect(bBounds.y + bBounds.height / 2).toBeCloseTo(cBounds.y + cBounds.height / 2)
  })

  test("enclose keeps children inside container", () => {
    const boundary = createBoundary("boundary")
    const a = createActor("child-a")
    const b = createActor("child-b")

    hint.arrangeVertical(a.id, b.id)
    hint.enclose(toContainerSymbolId(boundary.id), [a.id, b.id])
    context.solveAndApply(symbols.getAll())

    const aBounds = getBoundsValues(a.layout)
    const bBounds = getBoundsValues(b.layout)
    const boundaryBounds = getBoundsValues(boundary.layout)
    expect(aBounds.x).toBeGreaterThanOrEqual(boundaryBounds.x)
    expect(bBounds.y + bBounds.height).toBeLessThanOrEqual(
      boundaryBounds.y + boundaryBounds.height
    )
  })

  test("guide builder aligns to shared variable and arranges symbols", () => {
    const a = createActor("top")
    const b = createActor("bottom")

    const guide = hint.createGuideY().alignTop(a.id).alignBottom(b.id).arrange()

    context.solveAndApply(symbols.getAll())

    const aBounds = getBoundsValues(a.layout)
    const bBounds = getBoundsValues(b.layout)
    const guideValue = context.valueOf(guide.y)
    expect(aBounds.y).toBeCloseTo(guideValue)
    expect(bBounds.y + bBounds.height).toBeCloseTo(guideValue)
    expect(bBounds.x).toBeCloseTo(
      aBounds.x + aBounds.width + DefaultTheme.defaultStyleSet.horizontalGap
    )
  })
})
