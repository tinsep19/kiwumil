// src/render/svg_renderer.ts
import type { SymbolBase } from "../model/symbol_base"
import type { Association } from "../model/relationships/association"
import type { SymbolId } from "../model/types"
import type { Theme } from "../core/theme"

export class SvgRenderer {
  private symbols: SymbolBase[]
  private relationships: Association[]
  private theme?: Theme

  constructor(symbols: SymbolBase[], relationships: Association[] = [], theme?: Theme) {
    this.symbols = symbols
    this.relationships = relationships
    this.theme = theme
  }

  render(): string {
    const symbolsSvg = this.symbols.map(s => s.toSVG()).join("\n")
    
    // Create symbol map for relationship rendering
    const symbolMap = new Map<SymbolId, SymbolBase>()
    for (const symbol of this.symbols) {
      symbolMap.set(symbol.id, symbol)
    }
    
    const relationshipsSvg = this.relationships
      .map(r => r.toSVG(symbolMap))
      .join("\n")
    
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
    const bgColor = this.theme?.colors.background || "white"

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${width}" 
     height="${height}" 
     viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  ${relationshipsSvg}
  ${symbolsSvg}
</svg>`
  }

  saveToFile(filepath: string) {
    const svg = this.render()
    Bun.write(filepath, svg)
    console.log(`Saved to ${filepath}`)
  }
}
