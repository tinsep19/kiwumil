// src/render/svg_renderer.ts
import type { SymbolBase } from "../model/symbol_base"
import type { RelationshipBase } from "../model/relationship_base"
import type { SymbolId } from "../model/types"
import type { Theme } from "../theme"
import { DiagramSymbol } from "../model/diagram_symbol"

interface RenderElement {
  zIndex: number
  svg: string
}

export class SvgRenderer {
  private symbols: SymbolBase[]
  private relationships: RelationshipBase[]
  private theme?: Theme

  constructor(symbols: SymbolBase[], relationships: RelationshipBase[] = [], theme?: Theme) {
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
    
    // Calculate viewport size based on DiagramSymbol bounds if available
    let diagramWidth: number | undefined
    let diagramHeight: number | undefined
    for (const symbol of this.symbols) {
      if (symbol instanceof DiagramSymbol && symbol.bounds) {
        diagramWidth = symbol.bounds.width
        diagramHeight = symbol.bounds.height
        break
      }
    }

    let width: number
    let height: number
    if (typeof diagramWidth === "number" && typeof diagramHeight === "number") {
      width = diagramWidth
      height = diagramHeight
    } else {
      let maxX = 0
      let maxY = 0
      for (const symbol of this.symbols) {
        if (symbol.bounds) {
          maxX = Math.max(maxX, symbol.bounds.x + symbol.bounds.width)
          maxY = Math.max(maxY, symbol.bounds.y + symbol.bounds.height)
        }
      }
      width = maxX + 50
      height = maxY + 50
    }

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
    
    if (typeof Bun !== "undefined" && Bun.write) {
      Bun.write(filepath, svg)
      console.log(`Saved to ${filepath}`)
    } else {
      throw new Error("File system operations are only supported in Bun environment")
    }
  }

  renderToElement(element: Element) {
    const svg = this.render()
    element.innerHTML = svg
  }
}
