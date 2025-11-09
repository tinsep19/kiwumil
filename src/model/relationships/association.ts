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

    const fromX = fromSymbol.bounds.x + fromSymbol.bounds.width / 2
    const fromY = fromSymbol.bounds.y + fromSymbol.bounds.height / 2
    const toX = toSymbol.bounds.x + toSymbol.bounds.width / 2
    const toY = toSymbol.bounds.y + toSymbol.bounds.height / 2

    // テーマから色を取得（relationshipはdefaultConfigを使用）
    const strokeColor = this.theme?.defaultConfig.strokeColor || "black"
    const strokeWidth = this.theme?.defaultConfig.strokeWidth || 1.5

    return `
      <line x1="${fromX}" y1="${fromY}" x2="${toX}" y2="${toY}"
            stroke="${strokeColor}" stroke-width="${strokeWidth}"/>
    `
  }
}
