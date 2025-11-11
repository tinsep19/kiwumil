// src/plugin/core/symbols/rounded_rectangle_symbol.ts
import { SymbolBase } from "../../../model/symbol_base"
import { getStyleForSymbol } from "../../../core/theme"

export class RoundedRectangleSymbol extends SymbolBase {
  getDefaultSize() {
    return { width: 120, height: 60 }
  }

  toSVG(): string {
    if (!this.bounds) {
      throw new Error(`RoundedRectangle ${this.id} has no bounds`)
    }

    const { x, y, width, height } = this.bounds
    const cx = x + width / 2
    const cy = y + height / 2
    const rx = 10 // 角丸の半径
    const ry = 10

    const style = this.theme ? getStyleForSymbol(this.theme, 'roundedRectangle') : {
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
        <!-- Rounded Rectangle -->
        <rect x="${x}" y="${y}" width="${width}" height="${height}" 
              rx="${rx}" ry="${ry}"
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
