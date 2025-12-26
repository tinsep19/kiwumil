import { describe, beforeEach, test, expect } from "bun:test"
import { LayoutContext } from "@/model"
import { KiwiSolver } from "@/kiwi"
import { HintFactory, Symbols } from "@/dsl"
import { DefaultTheme } from "@/theme"
import { ActorSymbol, SystemBoundarySymbol } from "@/plugin/uml"

describe("LayoutConstraints metadata", () => {
  let context: LayoutContext
  let hint: HintFactory
  let symbols: Symbols
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
      const stereotypeItem = r.createItemBounds("stereotype")
      const iconMeta = {
        raw: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
        viewBox: "0 0 24 24",
        width: 24,
        height: 24,
        href: "actor-icon",
      }
      const actor = new ActorSymbol({
        label: id,
        icon: iconMeta,
        characs: {
          id: symbolId,
          bounds: bound,
          icon: iconItem,
          label: labelItem,
          stereotype: stereotypeItem,
        },
        theme: DefaultTheme,
      })
      r.setSymbol(actor)
      r.setCharacs({ id: symbolId, bounds: bound })
      r.setConstraint((builder) => {
        actor.ensureLayoutBounds(builder)
      })
      return r.build()
    }).characs
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
    }).characs
  }

  test("arrangeHorizontal records logical constraints per neighbor pair", () => {
    const a = createActor("a")
    const b = createActor("b")
    const c = createActor("c")

    hint.arrangeHorizontal(a, b, c)

    const entries = context.hints.list()

    // arrangeHorizontal creates one constraint entry with two sibling constraints
    // (three symbols -> two sibling constraints)
    const arrangeConstraints = entries.filter(
      (constraint) => constraint.rawConstraints.length === 2
    )

    expect(arrangeConstraints).toHaveLength(1)
    expect(arrangeConstraints[0].rawConstraints).toHaveLength(2)
  })

  test("enclose records required bounds for each child", () => {
    const boundary = createBoundary("boundary")
    const first = createActor("first")
    const second = createActor("second")

    hint.enclose(boundary, [first, second])
    context.solve()

    // Verify that the enclose operation worked by checking that
    // the children are within the boundary after solving
    const getBoundsValues = (bounds: any) => ({
      x: context.valueOf(bounds.x),
      y: context.valueOf(bounds.y),
      width: context.valueOf(bounds.width),
      height: context.valueOf(bounds.height),
    })

    const boundaryBounds = getBoundsValues(boundary.bounds)
    const firstBounds = getBoundsValues(first.bounds)
    const secondBounds = getBoundsValues(second.bounds)

    // Children should be within the boundary
    expect(firstBounds.x).toBeGreaterThanOrEqual(boundaryBounds.x)
    expect(secondBounds.x).toBeGreaterThanOrEqual(boundaryBounds.x)
    expect(firstBounds.x + firstBounds.width).toBeLessThanOrEqual(
      boundaryBounds.x + boundaryBounds.width
    )
  })
})
