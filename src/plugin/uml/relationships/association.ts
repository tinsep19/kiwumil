// src/plugin/uml/relationships/association.ts
import {
  RelationshipBase,
  type RelationshipBaseOptions,
} from "../../../model/relationship_base"
import type { SymbolBase } from "../../../model/symbol_base"
import type { SymbolId } from "../../../core"
import { getBoundsValues } from "../../../core"

export class Association extends RelationshipBase {
  constructor(options: RelationshipBaseOptions) {
    super(options)
  }

  toSVG(symbols: Map<SymbolId, SymbolBase>): string {
    const fromSymbol = symbols.get(this.from)
    const toSymbol = symbols.get(this.to)

    if (!fromSymbol || !toSymbol) {
      throw new Error(`Association endpoints not found or not positioned`)
    }

    const fromBounds = getBoundsValues(fromSymbol.bounds)
    const toBounds = getBoundsValues(toSymbol.bounds)

    const fromCenter = {
      x: fromBounds.x + fromBounds.width / 2,
      y: fromBounds.y + fromBounds.height / 2,
    }
    const toCenter = {
      x: toBounds.x + toBounds.width / 2,
      y: toBounds.y + toBounds.height / 2,
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
