import { describe, test, beforeEach, expect } from "bun:test"
import { LayoutContext } from "@/model"
import { KiwiSolver } from "@/kiwi"
import { getBoundsValues } from "@/core"
import { ActorSymbol, UsecaseSymbol, SystemBoundarySymbol } from "@/plugin/uml"
import { DiagramSymbol } from "@/model"
import { HintFactory, Symbols } from "@/dsl"
import { DefaultTheme } from "@/theme"

describe("Layout pipeline", () => {
  let symbols: Symbols
  let context: LayoutContext
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

  function createActor(id: string) {
    return symbols.register("test", "actor", (symbolId, r) => {
      const bound = r.createLayoutBounds("layout")
      const iconItem = r.createItemBounds("icon")
      const labelItem = r.createItemBounds("label")
      const iconMeta = {
        raw: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
        viewBox: "0 0 24 24",
      }
      const actor = new ActorSymbol({
        label: id,
        icon: iconMeta,
        characs: {
          id: symbolId,
          bounds: bound,
          icon: iconItem,
          label: labelItem,
        },
        theme: DefaultTheme,
      })
      r.setSymbol(actor)
      r.setCharacs({ id: symbolId, bounds: bound })
      r.setConstraint((builder) => {
        actor.ensureLayoutBounds(builder)
      })
      return r.build()
    }).symbol as ActorSymbol
  }

  function createUsecase(id: string) {
    return symbols.register("test", "usecase", (symbolId, r) => {
      const bound = r.createLayoutBounds("layout")
      const usecase = new UsecaseSymbol({
        id: symbolId,
        bounds: bound,
        label: id,
        theme: DefaultTheme,
      })
      r.setSymbol(usecase)
      r.setCharacs({ id: symbolId, bounds: bound })
      r.setConstraint((builder) => {
        usecase.ensureLayoutBounds(builder)
      })
      return r.build()
    }).symbol as UsecaseSymbol
  }

  function createBoundary(id: string) {
    return symbols.register("test", "systemBoundary", (symbolId, r) => {
      const bound = r.createLayoutBounds("layout")
      const container = r.createContainerBounds("container")
      const boundary = new SystemBoundarySymbol({
        id: symbolId,
        bounds: bound,
        container,
        label: id,
        theme: DefaultTheme,
      })
      r.setSymbol(boundary)
      r.setCharacs({ id: symbolId, bounds: bound, container })
      r.setConstraint((builder) => {
        boundary.ensureLayoutBounds(builder)
      })
      return r.build()
    }).symbol as SystemBoundarySymbol
  }

  test("diagram symbol is anchored at the origin with minimum size", () => {
    const diagramId = "__diagram__"
    const diagramBound = context.variables.createBounds(diagramId)
    const diagramContainer = context.variables.createBounds(`${diagramId}.container`, "container")
    const titleItem = context.variables.createBounds(`${diagramId}.title`, "item")
    const diagram = new DiagramSymbol({
      characs: {
        id: diagramId,
        bounds: diagramBound,
        container: diagramContainer,
        title: titleItem,
      },
      info: { title: "Test" },
      theme: DefaultTheme,
    })
    // Register constraints manually since we removed registerContainerConstraints
    context.createConstraint(`constraints/${diagram.id}`, (builder) => {
      diagram.ensureLayoutBounds(builder)
    })
    context.solve()

    const bounds = getBoundsValues(diagram.bounds)
    expect(bounds.x).toBeCloseTo(0)
    expect(bounds.y).toBeCloseTo(0)
    expect(bounds.width).toBeGreaterThanOrEqual(200)
    expect(bounds.height).toBeGreaterThanOrEqual(150)
  })

  test("arrangeHorizontal positions elements with default gap", () => {
    const a = createActor("a")
    const b = createActor("b")

    hint.arrangeHorizontal(a.id, b.id)
    context.solve()

    const aBounds = getBoundsValues(a.bounds)
    const bBounds = getBoundsValues(b.bounds)
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
    context.solve()

    const aBounds = getBoundsValues(a.bounds)
    const bBounds = getBoundsValues(b.bounds)
    const cBounds = getBoundsValues(c.bounds)
    expect(aBounds.y + aBounds.height / 2).toBeCloseTo(bBounds.y + bBounds.height / 2)
    expect(bBounds.y + bBounds.height / 2).toBeCloseTo(cBounds.y + cBounds.height / 2)
  })

  test("enclose keeps children inside container", () => {
    const boundary = createBoundary("boundary")
    const a = createActor("child-a")
    const b = createActor("child-b")

    hint.arrangeVertical(a.id, b.id)
    hint.enclose(boundary.id, [a.id, b.id])
    context.solve()

    const aBounds = getBoundsValues(a.bounds)
    const bBounds = getBoundsValues(b.bounds)
    const boundaryBounds = getBoundsValues(boundary.bounds)
    expect(aBounds.x).toBeGreaterThanOrEqual(boundaryBounds.x)
    expect(bBounds.y + bBounds.height).toBeLessThanOrEqual(boundaryBounds.y + boundaryBounds.height)
  })

  test("guide builder aligns to shared variable and arranges symbols", () => {
    const a = createActor("top")
    const b = createActor("bottom")

    const guide = hint.guideY().alignTop(a.id).alignBottom(b.id).arrange()

    context.solve()

    const aBounds = getBoundsValues(a.bounds)
    const bBounds = getBoundsValues(b.bounds)
    const guideValue = context.valueOf(guide.y)
    expect(aBounds.y).toBeCloseTo(guideValue)
    expect(bBounds.y + bBounds.height).toBeCloseTo(guideValue)
    expect(bBounds.x).toBeCloseTo(
      aBounds.x + aBounds.width + DefaultTheme.defaultStyleSet.horizontalGap
    )
  })
})
