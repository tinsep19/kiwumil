// src/render/svg_renderer.ts
import type { RelationshipBase, SymbolBase } from "../model"
import type { SymbolId } from "../core"
import type { Theme } from "../theme"
import { DiagramSymbol } from "../model"
import { getBoundsValues } from "../layout"

interface RenderElement {
  zIndex: number
  svg: string
}

function hasLabel(symbol: SymbolBase): symbol is SymbolBase & { label: string } {
  return typeof (symbol as { label?: unknown }).label === "string"
}

function getSymbolLabel(symbol: SymbolBase): string {
  if (hasLabel(symbol)) {
    return symbol.label
  }
  return "unknown"
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
    // Read z from layout.z via getBoundsValues, default to 0 if not finite
    const bounds = getBoundsValues(symbol.layout)
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

    const content = renderElements.map((e) => e.svg).join("\n")

    // 不正な bounds を持つシンボルを検出
    const minViewport = 100 // viewport の最小サイズ
    const minBoundsSize = 0.1 // bounds の最小有効サイズ
    const maxBoundsSize = 10000 // bounds の最大有効サイズ

    for (const symbol of this.symbols) {
      const bounds = getBoundsValues(symbol.layout)
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
    for (const symbol of this.symbols) {
      if (symbol instanceof DiagramSymbol) {
        const bounds = getBoundsValues(symbol.layout)
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
      for (const symbol of this.symbols) {
        const bounds = getBoundsValues(symbol.layout)
        maxX = Math.max(maxX, bounds.x + bounds.width)
        maxY = Math.max(maxY, bounds.y + bounds.height)
      }
      width = Math.max(minViewport, maxX + 50)
      height = Math.max(minViewport, maxY + 50)
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
