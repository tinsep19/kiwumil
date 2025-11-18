import { describe, beforeEach, test, expect } from "bun:test"
import { LayoutContext } from "../src/layout/layout_context"
import { HintFactory } from "../src/dsl/hint_factory"
import { DefaultTheme } from "../src/core/theme"
import { ActorSymbol } from "../src/plugin/uml/symbols/actor_symbol"
import { SystemBoundarySymbol } from "../src/plugin/uml/symbols/system_boundary_symbol"
import { toContainerSymbolId } from "../src/model/types"
import type { SymbolBase } from "../src/model/symbol_base"
import { applyFixedSize } from "../src/layout/constraint_helpers"

describe("LayoutConstraints metadata", () => {
  let layout: LayoutContext
  let hint: HintFactory
  let symbols: SymbolBase[]

  beforeEach(() => {
    symbols = []
    layout = new LayoutContext(DefaultTheme, id => symbols.find(symbol => symbol.id === id))
    hint = new HintFactory(layout, symbols)
  })

  function createActor(id: string) {
    const actor = new ActorSymbol(id, id, layout.vars)
    applyFixedSize(layout, actor)
    symbols.push(actor)
    return actor
  }

  function createBoundary(id: string) {
    const boundary = new SystemBoundarySymbol(toContainerSymbolId(id), id, layout)
    symbols.push(boundary)
    return boundary
  }

  test("arrangeHorizontal records logical constraints per neighbor pair", () => {
    const a = createActor("a")
    const b = createActor("b")
    const c = createActor("c")

    hint.arrangeHorizontal(a.id, b.id, c.id)

    const entries = layout
      .constraints
      .list()
      .filter(constraint => constraint.type === "arrangeHorizontal")

    expect(entries).toHaveLength(1)
    expect(entries[0].rawConstraints).toHaveLength(2) // three symbols -> two sibling constraints
  })

  test("enclose records required bounds for each child", () => {
    const boundary = createBoundary("boundary")
    const first = createActor("first")
    const second = createActor("second")

    hint.enclose(boundary.id, [first.id, second.id])

    const entry = layout
      .constraints
      .list()
      .find(constraint => constraint.type === "enclose")

    expect(entry).toBeDefined()
    expect(entry?.rawConstraints).toHaveLength(8) // four required constraints per child
  })
})
