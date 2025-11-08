// src/model/relationships/association.ts
import type { SymbolBase } from "../symbol_base"
import type { SymbolId } from "../types"

export class Association {
  constructor(
    public from: SymbolId,
    public to: SymbolId
  ) {}

  toSVG(symbols: Map<SymbolId, SymbolBase>): string {
    const fromSymbol = symbols.get(this.from)
    const toSymbol = symbols.get(this.to)

    if (!fromSymbol?.bounds || !toSymbol?.bounds) {
      throw new Error(`Association endpoints not found or not positioned`)
    }

    const fromX = fromSymbol.bounds.x + fromSymbol.bounds.width / 2
    const fromY = fromSymbol.bounds.y + fromSymbol.bounds.height / 2
    const toX = toSymbol.bounds.x + toSymbol.bounds.width / 2
    const toY = toSymbol.bounds.y + toSymbol.bounds.height / 2

    return `
      <line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}"
            stroke="black" stroke-width="1.5"/>
    `
  }
}
