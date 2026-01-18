// src/infrastructure/render/svg_renderer.ts
import type { ISymbol, SymbolId } from "../../core"
import type { Theme } from "../../theme"
import { DiagramSymbol } from "../../model"
import { getBoundsValues } from "../../core"

import type { LayoutContext, SymbolRegistry, RelationshipRegistry } from "../../model"
import type { IconRegistry } from "../../icon"

interface RenderElement {
  zIndex: number
  svg: string
}

function hasLabel(symbol: ISymbol): symbol is ISymbol & { label: string } {
  return typeof (symbol as { label?: unknown }).label === "string"
}

function getSymbolLabel(symbol: ISymbol): string {
  if (hasLabel(symbol)) {
    return symbol.label
  }
  return "unknown"
}

export class SvgRenderer {
  private readonly symbols: SymbolRegistry
  private readonly relationships: RelationshipRegistry
  private readonly theme: Theme
  private readonly iconRegistry: IconRegistry

  constructor(
    context: LayoutContext
  ) {
    const {
      symbols,
      relationships,
      theme,
      iconRegistry
    } = context
    
    this.symbols = symbols
    this.relationships = relationships
    this.theme = theme
    this.iconRegistry = iconRegistry
  }

  // Public getters for accessing symbols and relationships in tests
  getSymbols(): readonly ISymbol[] {
    return this.symbols.getAllSymbols()
  }

  getRelationships() {
    return this.relationships.getAll()
  }

  private calculateSymbolZIndex(symbol: ISymbol): number {
    // Read z from layout.z via getBoundsValues, default to 0 if not finite
    const bounds = getBoundsValues(symbol.bounds)
    const z = Number.isFinite(bounds.z) ? bounds.z : 0

    if (symbol.constructor.name === "SystemBoundarySymbol") {
      // Boundary は背景（ネストレベルが深いほど上に）
      return z * 100 - 100
    } else {
      // 通常のシンボルは前景
      return z * 100 + 50
    }
  }

  render(): string {
    // すべての描画要素を収集
    const renderElements: RenderElement[] = []

    // Get symbols and relationships using new APIs
    const allSymbols = this.symbols.getAllSymbols()
    const allRelationships = this.relationships.getAll()

    // Create symbol map for relationship rendering
    const symbolMap = new Map<SymbolId, ISymbol>()
    for (const symbol of allSymbols) {
      symbolMap.set(symbol.id, symbol)
    }

    // Symbols
    for (const symbol of allSymbols) {
      const zIndex = this.calculateSymbolZIndex(symbol)
      renderElements.push({ zIndex, svg: symbol.render() })
    }

    // Relationships
    for (const rel of allRelationships) {
      const zIndex = rel.calculateZIndex(symbolMap)
      renderElements.push({ zIndex, svg: rel.toSVG(symbolMap) })
    }

    // zIndex でソート
    renderElements.sort((a, b) => a.zIndex - b.zIndex)

    const content = renderElements.map((e) => e.svg).join("\n")

    // 不正な bounds を持つシンボルを検出
    const minViewport = 100 // viewport の最小サイズ
    const minBoundsSize = 0.1 // bounds の最小有効サイズ
    const maxBoundsSize = 10000 // bounds の最大有効サイズ

    for (const symbol of allSymbols) {
      const bounds = getBoundsValues(symbol.bounds)
      // 極端に小さい、大きい、または不正な値をチェック
      if (
        bounds.width < minBoundsSize ||
        bounds.height < minBoundsSize ||
        bounds.width > maxBoundsSize ||
        bounds.height > maxBoundsSize
      ) {
        const label = getSymbolLabel(symbol)
        console.warn(
          `[SvgRenderer] Abnormal bounds detected for symbol:`,
          `id=${symbol.id}, label="${label}",`,
          `bounds={x:${bounds.x}, y:${bounds.y}, width:${bounds.width}, height:${bounds.height}, z:${bounds.z}}`
        )
      }
    }

    // Calculate viewport size based on DiagramSymbol bounds if available
    let diagramWidth: number | undefined
    let diagramHeight: number | undefined
    for (const symbol of allSymbols) {
      if (symbol instanceof DiagramSymbol) {
        const bounds = getBoundsValues(symbol.bounds)
        diagramWidth = bounds.width
        diagramHeight = bounds.height
        break
      }
    }

    let width: number
    let height: number
    // DiagramSymbol の bounds が有効かチェック
    const isDiagramBoundsValid =
      typeof diagramWidth === "number" &&
      typeof diagramHeight === "number" &&
      Number.isFinite(diagramWidth) &&
      Number.isFinite(diagramHeight) &&
      diagramWidth >= minViewport &&
      diagramHeight >= minViewport

    if (isDiagramBoundsValid) {
      width = diagramWidth!
      height = diagramHeight!
    } else {
      // DiagramSymbol の bounds が不正な場合はフォールバック
      if (typeof diagramWidth === "number" && typeof diagramHeight === "number") {
        console.warn(
          `[SvgRenderer] Invalid DiagramSymbol bounds detected:`,
          `width=${diagramWidth}, height=${diagramHeight},`,
          `falling back to maxX/maxY calculation`
        )
      }

      let maxX = 0
      let maxY = 0
      for (const symbol of allSymbols) {
        const bounds = getBoundsValues(symbol.bounds)
        maxX = Math.max(maxX, bounds.x + bounds.width)
        maxY = Math.max(maxY, bounds.y + bounds.height)
      }
      width = Math.max(minViewport, maxX + 50)
      height = Math.max(minViewport, maxY + 50)
    }

    const bgColor = this.theme?.defaultStyleSet.backgroundColor || "white"
    const defs = this.iconRegistry ? this.iconRegistry.emit_symbols() : ""

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${width}" 
     height="${height}" 
     viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bgColor}"/>
  ${defs}
  ${content}
</svg>`
  }
}
