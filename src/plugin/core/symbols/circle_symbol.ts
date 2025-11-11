// src/plugin/core/symbols/circle_symbol.ts
import { SymbolBase } from "../../../model/symbol_base"
import { getStyleForSymbol } from "../../../core/theme"

export class CircleSymbol extends SymbolBase {
  getDefaultSize() {
    return { width: 60, height: 60 }
  }

  toSVG(): string {
    if (!this.bounds) {
      throw new Error(`Circle ${this.id} has no bounds`)
    }

    const { x, y, width, height } = this.bounds
    const cx = x + width / 2
    const cy = y + height / 2
    const r = Math.min(width, height) / 2

    const style = this.theme ? getStyleForSymbol(this.theme, 'circle') : {
      strokeColor: 'black',
      strokeWidth: 2,
      fillColor: 'white',
      textColor: 'black',
      fontSize: 12,
      backgroundColor: 'white'
    }

    return `
      <g id="${this.id}">
        <!-- Circle -->
        <circle cx="${cx}" cy="${cy}" r="${r}" 
                fill="${style.fillColor}" 
                stroke="${style.strokeColor}" 
                stroke-width="${style.strokeWidth}"/>
        
        <!-- Label -->
        <text x="${cx}" y="${cy + 5}" 
              text-anchor="middle" 
              font-size="${style.fontSize}" 
              font-family="Arial"
              fill="${style.textColor}">
          ${this.label}
        </text>
      </g>
    `
  }
}
