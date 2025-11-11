// src/model/symbols/usecase_symbol.ts
import { SymbolBase } from "../symbol_base"
import { getStyleForSymbol } from "../../core/theme"

export class UsecaseSymbol extends SymbolBase {
  getDefaultSize() {
    const style = this.theme ? getStyleForSymbol(this.theme, 'usecase') : {
      fontSize: 12
    }
    const fontSize = style.fontSize || 12
    const textWidth = this.estimateTextWidth(this.label, fontSize)
    const width = Math.max(120, textWidth + 40)
    const height = 60
    return { width, height }
  }

  private estimateTextWidth(text: string, fontSize: number): number {
    let width = 0
    for (const char of text) {
      if (char.match(/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\uff00-\uffef]/)) {
        width += fontSize
      } else {
        width += fontSize * 0.6
      }
    }
    return width
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

    const style = this.theme ? getStyleForSymbol(this.theme, 'usecase') : {
      strokeColor: 'black',
      strokeWidth: 2,
      fillColor: 'white',
      textColor: 'black',
      fontSize: 12,
      backgroundColor: 'white'
    }

    return `
      <g id="${this.id}">
        <!-- Ellipse -->
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" 
                 fill="${style.fillColor}" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/>
        
        <!-- Label -->
        <text x="${cx}" y="${cy + 5}" 
              text-anchor="middle" font-size="${style.fontSize}" font-family="Arial"
              fill="${style.textColor}">
          ${this.label}
        </text>
      </g>
    `
  }
}
