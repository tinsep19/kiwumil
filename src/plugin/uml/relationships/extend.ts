// src/plugin/uml/relationships/extend.ts
import { RelationshipBase } from "../../../model/relationship_base"
import type { SymbolBase } from "../../../model/symbol_base"
import type { SymbolId, RelationshipId } from "../../../model/types"
import { getBoundsValues } from "../../../layout/layout_bound"

export class Extend extends RelationshipBase {
  constructor(id: RelationshipId, from: SymbolId, to: SymbolId) {
    super(id, from, to)
  }

  toSVG(symbols: Map<SymbolId, SymbolBase>): string {
    const fromSymbol = symbols.get(this.from)
    const toSymbol = symbols.get(this.to)

    if (!fromSymbol || !toSymbol) {
      throw new Error(`Extend endpoints not found or not positioned`)
    }

    const fromBounds = getBoundsValues(fromSymbol.getLayoutBounds())
    const toBounds = getBoundsValues(toSymbol.getLayoutBounds())

    const fromCenter = {
      x: fromBounds.x + fromBounds.width / 2,
      y: fromBounds.y + fromBounds.height / 2,
    }
    const toCenter = {
      x: toBounds.x + toBounds.width / 2,
      y: toBounds.y + toBounds.height / 2,
    }

    const fromEdge = fromSymbol.getConnectionPoint(toCenter)
    const toEdge = toSymbol.getConnectionPoint(fromCenter)

    const strokeColor = this.theme?.defaultStyleSet.strokeColor || "black"
    const strokeWidth = this.theme?.defaultStyleSet.strokeWidth || 1.5
    const fontSize = this.theme?.defaultStyleSet.fontSize || 12

    const midX = (fromEdge.x + toEdge.x) / 2
    const midY = (fromEdge.y + toEdge.y) / 2

    const dx = toEdge.x - fromEdge.x
    const dy = toEdge.y - fromEdge.y
    const angle = Math.atan2(dy, dx)

    const arrowSize = 10
    const arrowX1 = toEdge.x - arrowSize * Math.cos(angle - Math.PI / 6)
    const arrowY1 = toEdge.y - arrowSize * Math.sin(angle - Math.PI / 6)
    const arrowX2 = toEdge.x - arrowSize * Math.cos(angle + Math.PI / 6)
    const arrowY2 = toEdge.y - arrowSize * Math.sin(angle + Math.PI / 6)

    return `
      <g>
        <line x1="${fromEdge.x}" y1="${fromEdge.y}" x2="${toEdge.x}" y2="${toEdge.y}"
              stroke="${strokeColor}" stroke-width="${strokeWidth}"
              stroke-dasharray="5,5"/>
        <line x1="${toEdge.x}" y1="${toEdge.y}" x2="${arrowX1}" y2="${arrowY1}"
              stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        <line x1="${toEdge.x}" y1="${toEdge.y}" x2="${arrowX2}" y2="${arrowY2}"
              stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
        <text x="${midX}" y="${midY - 5}" 
              font-size="${fontSize}" 
              fill="${strokeColor}"
              text-anchor="middle">«extend»</text>
      </g>
    `
  }
}
