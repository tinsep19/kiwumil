// src/model/symbols/usecase_symbol.ts
import { SymbolBase } from "../symbol_base"

export class UsecaseSymbol extends SymbolBase {
  getDefaultSize() {
    return { width: 120, height: 60 }
  }

  toSVG(): string {
    if (!this.bounds) {
      throw new Error(`Usecase ${this.id} has no bounds`)
    }

    const { x, y, width, height } = this.bounds
    const cx = x + width / 2
    const cy = y + height / 2
    const rx = width / 2
    const ry = height / 2

    return `
      <g id="${this.id}">
        <!-- Ellipse -->
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" 
                 fill="none" stroke="black" stroke-width="2"/>
        
        <!-- Label -->
        <text x="${cx}" y="${cy + 5}" 
              text-anchor="middle" font-size="12" font-family="Arial">
          ${this.label}
        </text>
      </g>
    `
  }
}
