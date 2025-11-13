// src/plugin/uml/relationships/generalize.ts
import type { SymbolBase } from "../../../model/symbol_base"
import type { SymbolId } from "../../../model/types"
import type { Theme } from "../../../core/theme"

export class Generalize {
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

  private getEllipseIntersection(
    cx: number, cy: number, rx: number, ry: number,
    px: number, py: number
  ): { x: number; y: number } {
    const dx = px - cx
    const dy = py - cy
    const angle = Math.atan2(dy, dx)
    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle)
    }
  }

  toSVG(symbols: Map<SymbolId, SymbolBase>): string {
    const fromSymbol = symbols.get(this.from)
    const toSymbol = symbols.get(this.to)

    if (!fromSymbol?.bounds || !toSymbol?.bounds) {
      throw new Error(`Generalization endpoints not found or not positioned`)
    }

    const fromCX = fromSymbol.bounds.x + fromSymbol.bounds.width / 2
    const fromCY = fromSymbol.bounds.y + fromSymbol.bounds.height / 2
    const fromRX = fromSymbol.bounds.width / 2
    const fromRY = fromSymbol.bounds.height / 2

    const toCX = toSymbol.bounds.x + toSymbol.bounds.width / 2
    const toCY = toSymbol.bounds.y + toSymbol.bounds.height / 2
    const toRX = toSymbol.bounds.width / 2
    const toRY = toSymbol.bounds.height / 2

    const fromEdge = this.getEllipseIntersection(fromCX, fromCY, fromRX, fromRY, toCX, toCY)
    const toEdge = this.getEllipseIntersection(toCX, toCY, toRX, toRY, fromCX, fromCY)

    const strokeColor = this.theme?.defaultStyleSet.strokeColor || "black"
    const strokeWidth = this.theme?.defaultStyleSet.strokeWidth || 1.5
    const fillColor = this.theme?.defaultStyleSet.backgroundColor || "white"

    const dx = toEdge.x - fromEdge.x
    const dy = toEdge.y - fromEdge.y
    const angle = Math.atan2(dy, dx)
    
    const arrowSize = 12
    const arrowX1 = toEdge.x - arrowSize * Math.cos(angle - Math.PI / 6)
    const arrowY1 = toEdge.y - arrowSize * Math.sin(angle - Math.PI / 6)
    const arrowX2 = toEdge.x - arrowSize * Math.cos(angle + Math.PI / 6)
    const arrowY2 = toEdge.y - arrowSize * Math.sin(angle + Math.PI / 6)

    return `
      <g>
        <line x1="${fromEdge.x}" y1="${fromEdge.y}" x2="${toEdge.x}" y2="${toEdge.y}"
              stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        <polygon points="${toEdge.x},${toEdge.y} ${arrowX1},${arrowY1} ${arrowX2},${arrowY2}"
                 fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
      </g>
    `
  }
}
