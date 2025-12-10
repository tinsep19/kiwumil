// src/model/relationship_base.ts
import type { SymbolBase } from "./symbol_base"
import type { SymbolId } from "../core"
import type { RelationshipId } from "./types"
import type { Theme } from "../theme"

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

    const fromLevel = fromSymbol?.nestLevel ?? 0
    const toLevel = toSymbol?.nestLevel ?? 0
    const maxLevel = Math.max(fromLevel, toLevel)

    return maxLevel * 100 + 10
  }

  abstract toSVG(symbols: Map<SymbolId, SymbolBase>): string
}
