// src/model/relationship_base.ts
import type { SymbolBase } from "./symbol_base"
import type { SymbolId } from "./types"
import type { Theme } from "../core/theme"

export abstract class RelationshipBase {
  protected theme?: Theme

  constructor(
    public from: SymbolId,
    public to: SymbolId
  ) {}

  setTheme(theme: Theme) {
    this.theme = theme
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
