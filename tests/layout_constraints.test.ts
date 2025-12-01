import { describe, beforeEach, test, expect } from "bun:test"
import { LayoutContext } from "@/layout"
import { HintFactory, Symbols } from "@/dsl"
import { DefaultTheme } from "@/theme"
import { ActorSymbol, SystemBoundarySymbol } from "@/plugin/uml"
import { toContainerSymbolId } from "@/model"

describe("LayoutConstraints metadata", () => {
  let context: LayoutContext
  let hint: HintFactory
  let symbols: Symbols

  beforeEach(() => {
    symbols = new Symbols()
    context = new LayoutContext(DefaultTheme)
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
      context.constraints.withSymbol(containerId, "containerInbounds", (builder) => {
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

    const entries = context.constraints
      .list()
      .filter((constraint) => constraint.type === "arrangeHorizontal")

    expect(entries).toHaveLength(1)
    expect(entries[0].rawConstraints).toHaveLength(2) // three symbols -> two sibling constraints
  })

  test("enclose records required bounds for each child", () => {
    const boundary = createBoundary("boundary")
    const first = createActor("first")
    const second = createActor("second")

    hint.enclose(boundary.id, [first.id, second.id])

    const entry = context.constraints.list().find((constraint) => constraint.type === "enclose")

    expect(entry).toBeDefined()
    expect(entry?.rawConstraints).toHaveLength(8) // four required constraints per child
  })
})
