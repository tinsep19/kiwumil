// src/plugin/uml/symbols/system_boundary_symbol.ts
import { SymbolBase } from "../../../model/symbol_base"
import { getStyleForSymbol } from "../../../core/theme"
import type { Point } from "../../../model/types"

export class SystemBoundarySymbol extends SymbolBase {
  defaultWidth = 300
  defaultHeight = 200

  getDefaultSize() {
    return { width: this.defaultWidth, height: this.defaultHeight }
  }

  getConnectionPoint(from: Point): Point {
    if (!this.bounds) {
      throw new Error(`SystemBoundary ${this.id} has no bounds`)
    }

    const cx = this.bounds.x + this.bounds.width / 2
    const cy = this.bounds.y + this.bounds.height / 2

    const dx = from.x - cx
    const dy = from.y - cy

    const halfWidth = this.bounds.width / 2
    const halfHeight = this.bounds.height / 2

    if (dx === 0 && dy === 0) {
      return { x: cx + halfWidth, y: cy }
    }

    const tx = dx !== 0 ? halfWidth / Math.abs(dx) : Infinity
    const ty = dy !== 0 ? halfHeight / Math.abs(dy) : Infinity

    const t = Math.min(tx, ty)

    return {
      x: cx + dx * t,
      y: cy + dy * t
    }
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
      fontFamily: 'Arial',
      backgroundColor: '#f8f8f8',
      horizontalGap: 80,
      verticalGap: 50
    }

    return `
      <g id="${this.id}">
        <!-- System Boundary Rectangle -->
        <rect x="${x}" y="${y}" width="${width}" height="${height}" 
              fill="${style.fillColor}" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/>
        
        <!-- Label at top -->
        <text x="${x + 10}" y="${y + style.fontSize + 5}" 
              font-size="${style.fontSize}" font-family="${style.fontFamily}" font-weight="bold"
              fill="${style.textColor}">
          ${this.label}
        </text>
      </g>
    `
  }
}
