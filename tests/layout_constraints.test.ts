import { describe, beforeEach, test, expect } from "bun:test"
import { LayoutContext } from "../src/layout/layout_context"
import { HintFactory } from "../src/dsl/hint_factory"
import { Symbols } from "../src/dsl/symbols"
import { DefaultTheme } from "../src/theme"
import { ActorSymbol } from "../src/plugin/uml/symbols/actor_symbol"
import { SystemBoundarySymbol } from "../src/plugin/uml/symbols/system_boundary_symbol"
import { toContainerSymbolId } from "../src/model/container_symbol"

describe("LayoutConstraints metadata", () => {
  let context: LayoutContext
  let hint: HintFactory
  let symbols: Symbols

  beforeEach(() => {
    symbols = new Symbols()
    context = new LayoutContext(DefaultTheme, (id) => symbols.findById(id))
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
