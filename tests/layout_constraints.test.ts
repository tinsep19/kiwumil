import { describe, beforeEach, test, expect } from "bun:test"
import { LayoutContext } from "@/model"
import { HintFactory, Symbols } from "@/dsl"
import { DefaultTheme } from "@/theme"
import { ActorSymbol, SystemBoundarySymbol } from "@/plugin/uml"
import { toContainerSymbolId } from "@/model"

describe("LayoutConstraints metadata", () => {
  let context: LayoutContext
  let hint: HintFactory
  let symbols: Symbols

  beforeEach(() => {
    context = new LayoutContext(DefaultTheme)
    symbols = new Symbols(context.variables)
    hint = new HintFactory({ context, symbols })
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

  function createBoundary(id: string) {
    return symbols.register("test", "systemBoundary", (symbolId) => {
      const containerId = toContainerSymbolId(symbolId)
      const bound = context.variables.createBound(containerId)
      const container = context.variables.createBound(`${containerId}.container`, "container")
      const boundary = new SystemBoundarySymbol({
        id: containerId,
        layout: bound,
        container,
        label: id,
        theme: DefaultTheme,
      })
      context.constraints.withSymbol(containerId, (builder) => {
        boundary.ensureLayoutBounds(builder)
      })
      return boundary
    })
  }

  test("arrangeHorizontal records logical constraints per neighbor pair", () => {
    const a = createActor("a")
    const b = createActor("b")
    const c = createActor("c")

    hint.arrangeHorizontal(a.id, b.id, c.id)

    const entries = context.constraints.list()

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

    // enclose creates one constraint entry with 8 required constraints
    // (four required constraints per child)
    const entry = context.constraints.list().find(
      (constraint) => constraint.rawConstraints.length === 8
    )

    expect(entry).toBeDefined()
    expect(entry?.rawConstraints).toHaveLength(8)
  })
})
