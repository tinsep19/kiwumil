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

    return `
      <g id="${this.id}">
        <!-- Head -->
        <circle cx="${cx}" cy="${y + headRadius + 5}" r="${headRadius}" 
                fill="none" stroke="black" stroke-width="2"/>
        
        <!-- Body -->
        <line x1="${cx}" y1="${bodyTop}" x2="${cx}" y2="${bodyBottom}" 
              stroke="black" stroke-width="2"/>
        
        <!-- Arms -->
        <line x1="${x + 5}" y1="${armY}" x2="${x + width - 5}" y2="${armY}" 
              stroke="black" stroke-width="2"/>
        
        <!-- Legs -->
        <line x1="${cx}" y1="${bodyBottom}" x2="${x + 10}" y2="${legBottom}" 
              stroke="black" stroke-width="2"/>
        <line x1="${cx}" y1="${bodyBottom}" x2="${x + width - 10}" y2="${legBottom}" 
              stroke="black" stroke-width="2"/>
        
        <!-- Label -->
        <text x="${cx}" y="${y + height}" 
              text-anchor="middle" font-size="12" font-family="Arial">
          ${this.label}
        </text>
      </g>
    `
  }
}
