// src/dsl/hint_factory.ts
import type { SymbolId } from "../model/types"
import type { SymbolBase } from "../model/symbol_base"

export interface LayoutHint {
  type: "horizontal" | "vertical" | "pack"
  symbolIds: SymbolId[]
  gap?: number
  containerId?: SymbolId
  childIds?: SymbolId[]
}

export class HintFactory {
  constructor(
    private hints: LayoutHint[],
    private symbols: SymbolBase[]
  ) {}

  horizontal(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "horizontal",
      symbolIds,
      gap: 80
    })
  }

  vertical(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "vertical",
      symbolIds,
      gap: 50
    })
  }

  pack(containerId: SymbolId, childIds: SymbolId[]) {
    // Set nestLevel for children
    const container = this.symbols.find(s => s.id === containerId)
    if (container) {
      const containerNestLevel = container.nestLevel
      for (const childId of childIds) {
        const child = this.symbols.find(s => s.id === childId)
        if (child) {
          child.nestLevel = containerNestLevel + 1
          child.containerId = containerId
        }
      }
    }

    this.hints.push({
      type: "pack",
      symbolIds: [],
      containerId,
      childIds
    })
  }
}
