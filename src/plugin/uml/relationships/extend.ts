// src/plugin/uml/relationships/extend.ts
import type { SymbolBase } from "../../../model/symbol_base"
import type { SymbolId } from "../../../model/types"
import type { Theme } from "../../../core/theme"

export class Extend {
  private theme?: Theme

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

  toSVG(symbols: Map<SymbolId, SymbolBase>): string {
    const fromSymbol = symbols.get(this.from)
    const toSymbol = symbols.get(this.to)

    if (!fromSymbol?.bounds || !toSymbol?.bounds) {
      throw new Error(`Extend endpoints not found or not positioned`)
    }

    const fromX = fromSymbol.bounds.x + fromSymbol.bounds.width / 2
    const fromY = fromSymbol.bounds.y + fromSymbol.bounds.height / 2
    const toX = toSymbol.bounds.x + toSymbol.bounds.width / 2
    const toY = toSymbol.bounds.y + toSymbol.bounds.height / 2

    const strokeColor = this.theme?.defaultStyleSet.strokeColor || "black"
    const strokeWidth = this.theme?.defaultStyleSet.strokeWidth || 1.5
    const fontSize = this.theme?.defaultStyleSet.fontSize || 12

    // Calculate midpoint for stereotype label
    const midX = (fromX + toX) / 2
    const midY = (fromY + toY) / 2

    // Calculate angle for arrow
    const dx = toX - fromX
    const dy = toY - fromY
    const angle = Math.atan2(dy, dx)
    
    // Arrow size
    const arrowSize = 10
    const arrowX1 = toX - arrowSize * Math.cos(angle - Math.PI / 6)
    const arrowY1 = toY - arrowSize * Math.sin(angle - Math.PI / 6)
    const arrowX2 = toX - arrowSize * Math.cos(angle + Math.PI / 6)
    const arrowY2 = toY - arrowSize * Math.sin(angle + Math.PI / 6)

    return `
      <g>
        <line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}"
              stroke="${strokeColor}" stroke-width="${strokeWidth}"
              stroke-dasharray="5,5"/>
        <line x1="${toX}" y1="${toY}" x2="${arrowX1}" y2="${arrowY1}"
              stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        <line x1="${toX}" y1="${toY}" x2="${arrowX2}" y2="${arrowY2}"
              stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        <text x="${midX}" y="${midY - 5}" 
              font-size="${fontSize}" 
              fill="${strokeColor}"
              text-anchor="middle">«extend»</text>
      </g>
    `
  }
}
