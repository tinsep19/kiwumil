// src/plugin/core/symbols/rectangle_symbol.ts
import { SymbolBase } from "../../../model/symbol_base"
import { getStyleForSymbol } from "../../../theme"
import type { Point } from "../../../model/types"

export class RectangleSymbol extends SymbolBase {
  getDefaultSize() {
    return { width: 120, height: 60 }
  }

  getConnectionPoint(from: Point): Point {
    if (!this.bounds) {
      throw new Error(`Rectangle ${this.id} has no bounds`)
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
      throw new Error(`Rectangle ${this.id} has no bounds`)
    }

    const { x, y, width, height } = this.bounds
    const cx = x + width / 2
    const cy = y + height / 2

    const style = this.theme ? getStyleForSymbol(this.theme, 'rectangle') : {
      strokeColor: 'black',
      strokeWidth: 2,
      fillColor: 'white',
      textColor: 'black',
      fontSize: 12,
      fontFamily: 'Arial',
      backgroundColor: 'white',
      horizontalGap: 80,
      verticalGap: 50
    }

    return `
      <g id="${this.id}">
        <!-- Rectangle -->
        <rect x="${x}" y="${y}" width="${width}" height="${height}" 
              fill="${style.fillColor}" 
              stroke="${style.strokeColor}" 
              stroke-width="${style.strokeWidth}"/>
        
        <!-- Label -->
        <text x="${cx}" y="${cy + 5}" 
              text-anchor="middle" 
              font-size="${style.fontSize}" 
              font-family="${style.fontFamily}"
              fill="${style.textColor}">
          ${this.label}
        </text>
      </g>
    `
  }
}
