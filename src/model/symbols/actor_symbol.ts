// src/model/symbols/actor_symbol.ts
import { SymbolBase } from "../symbol_base"

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

    const stroke = this.theme?.colors.actorStroke || "black"
    const strokeWidth = this.theme?.strokeWidth.actor || 2
    const fontSize = this.theme?.fontSize.actor || 12
    const textColor = this.theme?.colors.text || "black"

    return `
      <g id="${this.id}">
        <!-- Head -->
        <circle cx="${cx}" cy="${y + headRadius + 5}" r="${headRadius}" 
                fill="none" stroke="${stroke}" stroke-width="${strokeWidth}"/>
        
        <!-- Body -->
        <line x1="${cx}" y1="${bodyTop}" x2="${cx}" y2="${bodyBottom}" 
              stroke="${stroke}" stroke-width="${strokeWidth}"/>
        
        <!-- Arms -->
        <line x1="${x + 5}" y1="${armY}" x2="${x + width - 5}" y2="${armY}" 
              stroke="${stroke}" stroke-width="${strokeWidth}"/>
        
        <!-- Legs -->
        <line x1="${cx}" y1="${bodyBottom}" x2="${x + 10}" y2="${legBottom}" 
              stroke="${stroke}" stroke-width="${strokeWidth}"/>
        <line x1="${cx}" y1="${bodyBottom}" x2="${x + width - 10}" y2="${legBottom}" 
              stroke="${stroke}" stroke-width="${strokeWidth}"/>
        
        <!-- Label -->
        <text x="${cx}" y="${y + height}" 
              text-anchor="middle" font-size="${fontSize}" font-family="Arial"
              fill="${textColor}">
          ${this.label}
        </text>
      </g>
    `
  }
}
