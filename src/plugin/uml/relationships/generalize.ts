// src/plugin/uml/relationships/generalize.ts
import { RelationshipBase } from "../../../model/relationship_base"
import type { SymbolBase } from "../../../model/symbol_base"
import type { SymbolId, RelationshipId } from "../../../model/types"
import { getBoundsValues } from "../../../layout/bounds"

export class Generalize extends RelationshipBase {
  constructor(id: RelationshipId, from: SymbolId, to: SymbolId) {
    super(id, from, to)
  }

  toSVG(symbols: Map<SymbolId, SymbolBase>): string {
    const fromSymbol = symbols.get(this.from)
    const toSymbol = symbols.get(this.to)

    if (!fromSymbol || !toSymbol) {
      throw new Error(`Generalization endpoints not found or not positioned`)
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
