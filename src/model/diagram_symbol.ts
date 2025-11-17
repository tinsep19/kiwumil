// src/model/diagram_symbol.ts
import { SymbolBase } from "./symbol_base"
import { getStyleForSymbol } from "../core/theme"
import type { Point } from "./types"
import type { DiagramInfo } from "./diagram_info"
import type { LayoutVariableContext } from "../layout/layout_variable_context"

export class DiagramSymbol extends SymbolBase {
  private diagramInfo: DiagramInfo

  constructor(id: string, titleOrInfo: string | DiagramInfo, layoutContext?: LayoutVariableContext) {
    const info = typeof titleOrInfo === "string" 
      ? { title: titleOrInfo }
      : titleOrInfo
    
    super(id, info.title, layoutContext)
    this.diagramInfo = info
  }

  getDefaultSize() {
    return { width: 200, height: 150 }
  }

  getConnectionPoint(from: Point): Point {
    if (!this.bounds) {
      throw new Error(`DiagramSymbol ${this.id} has no bounds`)
    }

    const cx = this.bounds.x + this.bounds.width / 2
    const cy = this.bounds.y + this.bounds.height / 2

    const dx = from.x - cx
    const dy = from.y - cy

    const halfWidth = this.bounds.width / 2
    const halfHeight = this.bounds.height / 2

    if (dx === 0 && dy === 0) {
      return { x: cx + halfWidth, y: cy }
    }

    const tx = dx !== 0 ? halfWidth / Math.abs(dx) : Infinity
    const ty = dy !== 0 ? halfHeight / Math.abs(dy) : Infinity

    const t = Math.min(tx, ty)

    return {
      x: cx + dx * t,
      y: cy + dy * t
    }
  }

  toSVG(): string {
    if (!this.bounds) {
      throw new Error(`DiagramSymbol ${this.id} has no bounds`)
    }

    const { x, y, width, height } = this.bounds
    const cx = x + width / 2

    const style = this.theme ? getStyleForSymbol(this.theme, 'rectangle') : {
      strokeColor: '#e0e0e0',
      strokeWidth: 1,
      fillColor: 'white',
      textColor: 'black',
      fontSize: 12,
      fontFamily: 'Arial',
      backgroundColor: 'white',
      horizontalGap: 80,
      verticalGap: 50
    }

    const titleFontSize = style.fontSize * 1.5
    const metaFontSize = style.fontSize * 0.75

    // Build metadata string
    let metaText = ""
    if (this.diagramInfo.createdAt && this.diagramInfo.author) {
      metaText = `Created: ${this.diagramInfo.createdAt} | Author: ${this.diagramInfo.author}`
    } else if (this.diagramInfo.createdAt) {
      metaText = `Created: ${this.diagramInfo.createdAt}`
    } else if (this.diagramInfo.author) {
      metaText = `Author: ${this.diagramInfo.author}`
    }

    return `
      <g id="${this.id}">
        <!-- Title -->
        <text x="${cx}" y="${y + 30}" 
              text-anchor="middle" 
              font-size="${titleFontSize}" 
              font-weight="bold"
              font-family="${style.fontFamily}"
              fill="${style.textColor}">
          ${this.diagramInfo.title}
        </text>
        ${metaText ? `
        <!-- Metadata -->
        <text x="${x + width - 10}" y="${y + height - 10}" 
              text-anchor="end" 
              font-size="${metaFontSize}" 
              font-family="${style.fontFamily}"
              fill="${style.textColor}"
              opacity="0.5">
          ${metaText}
        </text>` : ''}
      </g>
    `
  }
}
