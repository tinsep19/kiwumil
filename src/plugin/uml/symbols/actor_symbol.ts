// src/plugin/uml/symbols/actor_symbol.ts
import { SymbolBase } from "../../../model/symbol_base"
import { getStyleForSymbol } from "../../../core/theme"

export class ActorSymbol extends SymbolBase {
  getDefaultSize() {
    return { width: 60, height: 80 }
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
      fillColor: 'white',
      backgroundColor: 'white'
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
              text-anchor="middle" font-size="${style.fontSize}" font-family="Arial"
              fill="${style.textColor}">
          ${this.label}
        </text>
      </g>
    `
  }
}
