// src/model/relationship_base.ts
import type { SymbolBase } from "./symbol_base"
import type { SymbolId } from "../core"
import type { RelationshipId } from "./types"
import type { Theme } from "../theme"
import { getBoundsValues } from "../core"

export interface RelationshipBaseOptions {
  id: RelationshipId
  from: SymbolId
  to: SymbolId
  theme: Theme
}

export abstract class RelationshipBase {
  readonly id: RelationshipId
  readonly from: SymbolId
  readonly to: SymbolId
  protected readonly theme: Theme

  constructor(options: RelationshipBaseOptions) {
    this.id = options.id
    this.from = options.from
    this.to = options.to
    this.theme = options.theme
  }

  calculateZIndex(symbols: Map<SymbolId, SymbolBase>): number {
    const fromSymbol = symbols.get(this.from)
    const toSymbol = symbols.get(this.to)

    // Read z from layout.z via getBoundsValues, default to 0 if not available or not finite
    let fromZ = 0
    if (fromSymbol) {
      const fromBounds = getBoundsValues(fromSymbol.layout)
      fromZ = Number.isFinite(fromBounds.z) ? fromBounds.z : 0
    }

    let toZ = 0
    if (toSymbol) {
      const toBounds = getBoundsValues(toSymbol.layout)
      toZ = Number.isFinite(toBounds.z) ? toBounds.z : 0
    }

    const maxZ = Math.max(fromZ, toZ)
    return maxZ * 100 + 10
  }

  abstract toSVG(symbols: Map<SymbolId, SymbolBase>): string
}
