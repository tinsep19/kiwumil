// src/plugin/core/symbols/ellipse_symbol.ts
import { SymbolBase } from "../../../model/symbol_base"
import { getStyleForSymbol } from "../../../core/theme"
import type { Point } from "../../../model/types"

export class EllipseSymbol extends SymbolBase {
  getDefaultSize() {
    return { width: 120, height: 60 }
  }

  getConnectionPoint(from: Point): Point {
    if (!this.bounds) {
      throw new Error(`Ellipse ${this.id} has no bounds`)
    }

    const cx = this.bounds.x + this.bounds.width / 2
    const cy = this.bounds.y + this.bounds.height / 2
    const rx = this.bounds.width / 2
    const ry = this.bounds.height / 2

    const dx = from.x - cx
    const dy = from.y - cy

    const angle = Math.atan2(dy, dx)
    
    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle)
    }
  }

  toSVG(): string {
    if (!this.bounds) {
      throw new Error(`Ellipse ${this.id} has no bounds`)
    }

    const { x, y, width, height } = this.bounds
    const cx = x + width / 2
    const cy = y + height / 2
    const rx = width / 2
    const ry = height / 2

    const style = this.theme ? getStyleForSymbol(this.theme, 'ellipse') : {
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
        <!-- Ellipse -->
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" 
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
