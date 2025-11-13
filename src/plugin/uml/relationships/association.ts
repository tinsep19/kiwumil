// src/plugin/uml/relationships/association.ts
import type { SymbolBase } from "../../../model/symbol_base"
import type { SymbolId } from "../../../model/types"
import type { Theme } from "../../../core/theme"

export class Association {
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
    
    // 関連線は、両端の要素が属する最も深いコンテナの内側
    const fromLevel = fromSymbol?.nestLevel ?? 0
    const toLevel = toSymbol?.nestLevel ?? 0
    const maxLevel = Math.max(fromLevel, toLevel)
    
    return maxLevel * 100 + 10
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
