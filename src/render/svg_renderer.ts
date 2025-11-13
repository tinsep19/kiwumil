// src/render/svg_renderer.ts
import type { SymbolBase } from "../model/symbol_base"
import type { Association } from "../plugin/uml/relationships/association"
import type { Include } from "../plugin/uml/relationships/include"
import type { Extend } from "../plugin/uml/relationships/extend"
import type { Generalize } from "../plugin/uml/relationships/generalize"
import type { SymbolId } from "../model/types"
import type { Theme } from "../core/theme"

type Relationship = Association | Include | Extend | Generalize

interface RenderElement {
  zIndex: number
  svg: string
}

export class SvgRenderer {
  private symbols: SymbolBase[]
  private relationships: Relationship[]
  private theme?: Theme

  constructor(symbols: SymbolBase[], relationships: Relationship[] = [], theme?: Theme) {
    this.symbols = symbols
    this.relationships = relationships
    this.theme = theme
  }

  private calculateSymbolZIndex(symbol: SymbolBase): number {
    const nestLevel = symbol.nestLevel
    
    if (symbol.constructor.name === "SystemBoundarySymbol") {
      // Boundary は背景（ネストレベルが深いほど上に）
      return nestLevel * 100 - 100
    } else {
      // 通常のシンボルは前景
      return nestLevel * 100 + 50
    }
  }

  render(): string {
    // すべての描画要素を収集
    const renderElements: RenderElement[] = []
    
    // Create symbol map for relationship rendering
    const symbolMap = new Map<SymbolId, SymbolBase>()
    for (const symbol of this.symbols) {
      symbolMap.set(symbol.id, symbol)
    }
    
    // Symbols
    for (const symbol of this.symbols) {
      const zIndex = this.calculateSymbolZIndex(symbol)
      renderElements.push({ zIndex, svg: symbol.toSVG() })
    }
    
    // Relationships
    for (const rel of this.relationships) {
      const zIndex = rel.calculateZIndex(symbolMap)
      renderElements.push({ zIndex, svg: rel.toSVG(symbolMap) })
    }
    
    // zIndex でソート
    renderElements.sort((a, b) => a.zIndex - b.zIndex)
    
    const content = renderElements.map(e => e.svg).join("\n")
    
    // Calculate canvas size
    let maxX = 0, maxY = 0
    for (const symbol of this.symbols) {
      if (symbol.bounds) {
        maxX = Math.max(maxX, symbol.bounds.x + symbol.bounds.width)
        maxY = Math.max(maxY, symbol.bounds.y + symbol.bounds.height)
      }
    }

    const width = maxX + 50
    const height = maxY + 50
    const bgColor = this.theme?.defaultStyleSet.backgroundColor || "white"

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${width}" 
     height="${height}" 
     viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  ${content}
</svg>`
  }

  saveToFile(filepath: string) {
    const svg = this.render()
    Bun.write(filepath, svg)
    console.log(`Saved to ${filepath}`)
  }
}
