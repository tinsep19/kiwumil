// src/plugin/uml/relationships/association.ts
import { RelationshipBase } from "../../../model/relationship_base"
import type { SymbolBase } from "../../../model/symbol_base"
import type { SymbolId, RelationshipId } from "../../../model/types"

export class Association extends RelationshipBase {
  constructor(id: RelationshipId, from: SymbolId, to: SymbolId) {
    super(id, from, to)
  }

  toSVG(symbols: Map<SymbolId, SymbolBase>): string {
    const fromSymbol = symbols.get(this.from)
    const toSymbol = symbols.get(this.to)

    if (!fromSymbol?.bounds || !toSymbol?.bounds) {
      throw new Error(`Association endpoints not found or not positioned`)
    }

    const fromCenter = {
      x: fromSymbol.bounds.x + fromSymbol.bounds.width / 2,
      y: fromSymbol.bounds.y + fromSymbol.bounds.height / 2
    }
    const toCenter = {
      x: toSymbol.bounds.x + toSymbol.bounds.width / 2,
      y: toSymbol.bounds.y + toSymbol.bounds.height / 2
    }

    const fromPoint = fromSymbol.getConnectionPoint(toCenter)
    const toPoint = toSymbol.getConnectionPoint(fromCenter)

    // テーマから色を取得（relationshipはdefaultStyleSetを使用）
    const strokeColor = this.theme?.defaultStyleSet.strokeColor || "black"
    const strokeWidth = this.theme?.defaultStyleSet.strokeWidth || 1.5

    return `
      <line x1="${fromPoint.x}" y1="${fromPoint.y}" x2="${toPoint.x}" y2="${toPoint.y}"
            stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
    `
  }
}
