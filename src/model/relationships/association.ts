// src/model/relationships/association.ts
import type { SymbolBase } from "../symbol_base"
import type { SymbolId } from "../types"
import type { Theme } from "../../core/theme"

export class Association {
  private theme?: Theme

  constructor(
    public from: SymbolId,
    public to: SymbolId
  ) {}

  setTheme(theme: Theme) {
    this.theme = theme
  }

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

    const stroke = this.theme?.colors.relationshipStroke || "black"
    const strokeWidth = this.theme?.strokeWidth.relationship || 1.5

    return `
      <line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}"
            stroke="${stroke}" stroke-width="${strokeWidth}"/>
    `
  }
}
