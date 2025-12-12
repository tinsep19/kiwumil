import { describe, beforeEach, test, expect } from "bun:test"
import { LayoutContext } from "@/model"
import { LayoutSolver } from "@/layout"
import { HintFactory, Symbols } from "@/dsl"
import { DefaultTheme } from "@/theme"
import { ActorSymbol, SystemBoundarySymbol } from "@/plugin/uml"

describe("LayoutConstraints metadata", () => {
  let context: LayoutContext
  let hint: HintFactory
  let symbols: Symbols
  const diagramContainerId = "__diagram__"

  beforeEach(() => {
    const solver = new LayoutSolver()
    context = new LayoutContext(solver, DefaultTheme)
    symbols = new Symbols(context.variables)
    hint = new HintFactory({ context, symbols, diagramContainer: diagramContainerId })
  })

  function createActor(id: string) {
    return symbols.register("test", "actor", (symbolId, r) => {
      const bound = r.createBounds("layout", "layout")
      const actor = new ActorSymbol({
        id: symbolId,
        layout: bound,
        label: id,
        theme: DefaultTheme,
      })
      r.setSymbol(actor)
      r.setCharacs({ id: symbolId, layout: bound })
      r.setConstraint((builder) => {
        actor.ensureLayoutBounds(builder)
      })
      return r.build()
    }).symbol as ActorSymbol
  }

  function createBoundary(id: string) {
    return symbols.register("test", "systemBoundary", (symbolId, r) => {
      const bound = r.createBounds("layout", "layout")
      const container = r.createBounds("container", "container")
      const boundary = new SystemBoundarySymbol({
        id: symbolId,
        layout: bound,
        container,
        label: id,
        theme: DefaultTheme,
      })
      r.setSymbol(boundary)
      r.setCharacs({ id: symbolId, layout: bound, container })
      r.setConstraint((builder) => {
        boundary.ensureLayoutBounds(builder)
      })
      return r.build()
    }).symbol as SystemBoundarySymbol
  }

  test("arrangeHorizontal records logical constraints per neighbor pair", () => {
    const a = createActor("a")
    const b = createActor("b")
    const c = createActor("c")

    hint.arrangeHorizontal(a.id, b.id, c.id)

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

    hint.enclose(boundary.id, [first.id, second.id])

    // enclose creates one constraint entry with 10 constraints
    // (4 required bounds constraints + 1 z-index constraint per child)
    const entry = context.hints.list().find(
      (constraint) => constraint.rawConstraints.length === 10
    )

    expect(entry).toBeDefined()
    expect(entry?.rawConstraints).toHaveLength(10)
  })
})
