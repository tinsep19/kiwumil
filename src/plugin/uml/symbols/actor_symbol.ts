// src/plugin/uml/symbols/actor_symbol.ts
import { SymbolBase } from "../../../model/symbol_base"
import { getStyleForSymbol } from "../../../core/theme"
import type { Point } from "../../../model/types"

export class ActorSymbol extends SymbolBase {
  getDefaultSize() {
    return { width: 60, height: 80 }
  }

  getConnectionPoint(from: Point): Point {
    if (!this.bounds) {
      throw new Error(`Actor ${this.id} has no bounds`)
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
      throw new Error(`Actor ${this.id} has no bounds`)
    }

    const { x, y, width, height } = this.bounds
    const cx = x + width / 2
    const headRadius = width / 6
    const bodyTop = y + headRadius * 2 + 5
    const bodyBottom = y + height * 0.6
    const armY = bodyTop + (bodyBottom - bodyTop) * 0.3
    const legBottom = y + height - 15

    // テーマからスタイルを取得
    const style = this.theme ? getStyleForSymbol(this.theme, 'actor') : {
      strokeColor: 'black',
      strokeWidth: 2,
      textColor: 'black',
      fontSize: 12,
      fontFamily: 'Arial',
      fillColor: 'white',
      backgroundColor: 'white',
      horizontalGap: 80,
      verticalGap: 50
    }

    return `
      <g id="${this.id}">
        <!-- Head -->
        <circle cx="${cx}" cy="${y + headRadius + 5}" r="${headRadius}" 
                fill="none" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/>
        
        <!-- Body -->
        <line x1="${cx}" y1="${bodyTop}" x2="${cx}" y2="${bodyBottom}" 
              stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/>
        
        <!-- Arms -->
        <line x1="${x + 5}" y1="${armY}" x2="${x + width - 5}" y2="${armY}" 
              stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/>
        
        <!-- Legs -->
        <line x1="${cx}" y1="${bodyBottom}" x2="${x + 10}" y2="${legBottom}" 
              stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/>
        <line x1="${cx}" y1="${bodyBottom}" x2="${x + width - 10}" y2="${legBottom}" 
              stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/>
        
        <!-- Label -->
        <text x="${cx}" y="${y + height}" 
              text-anchor="middle" font-size="${style.fontSize}" font-family="${style.fontFamily}"
              fill="${style.textColor}">
          ${this.label}
        </text>
      </g>
    `
  }
}
