// src/plugin/uml/symbols/system_boundary_symbol.ts
import { SymbolBase } from "../../../model/symbol_base"
import { getStyleForSymbol } from "../../../core/theme"

export class SystemBoundarySymbol extends SymbolBase {
  defaultWidth = 300
  defaultHeight = 200

  getDefaultSize() {
    return { width: this.defaultWidth, height: this.defaultHeight }
  }

  toSVG(): string {
    if (!this.bounds) {
      throw new Error(`SystemBoundary ${this.id} has no bounds`)
    }

    const { x, y, width, height } = this.bounds

    // テーマからスタイルを取得
    const style = this.theme ? getStyleForSymbol(this.theme, 'systemBoundary') : {
      strokeColor: '#999',
      strokeWidth: 2,
      fillColor: '#f8f8f8',
      textColor: 'black',
      fontSize: 14,
      backgroundColor: '#f8f8f8'
    }

    return `
      <g id="${this.id}">
        <!-- System Boundary Rectangle -->
        <rect x="${x}" y="${y}" width="${width}" height="${height}" 
              fill="${style.fillColor}" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/>
        
        <!-- Label at top -->
        <text x="${x + 10}" y="${y + style.fontSize + 5}" 
              font-size="${style.fontSize}" font-family="Arial" font-weight="bold"
              fill="${style.textColor}">
          ${this.label}
        </text>
      </g>
    `
  }
}
