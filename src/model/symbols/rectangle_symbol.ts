// src/model/symbols/rectangle_symbol.ts
import { SymbolBase } from "../symbol_base"
import { getStyleForSymbol } from "../../core/theme"

export class RectangleSymbol extends SymbolBase {
  getDefaultSize() {
    return { width: 120, height: 60 }
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
      backgroundColor: 'white'
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
              font-family="Arial"
              fill="${style.textColor}">
          ${this.label}
        </text>
      </g>
    `
  }
}
