// src/model/symbols/system_boundary_symbol.ts
import { SymbolBase } from "../symbol_base"

export class SystemBoundarySymbol extends SymbolBase {
  children: SymbolBase[] = []
  defaultWidth = 300
  defaultHeight = 200
  background = "#f8f8f8"
  borderColor = "#999"

  getDefaultSize() {
    return { width: this.defaultWidth, height: this.defaultHeight }
  }

  getLayoutHints() {
    return this.children.map(c => ({ inside: [this, c] }))
  }

  toSVG(): string {
    if (!this.bounds) {
      throw new Error(`SystemBoundary ${this.id} has no bounds`)
    }

    const { x, y, width, height } = this.bounds
    const stroke = this.borderColor
    const fill = this.background
    const strokeWidth = this.theme?.strokeWidth.usecase || 2
    const fontSize = this.theme?.fontSize.usecase || 14
    const textColor = this.theme?.colors.text || "black"

    // Render children
    const childrenSVG = this.children.map(child => child.toSVG()).join("\n")

    return `
      <g id="${this.id}">
        <!-- System Boundary Rectangle -->
        <rect x="${x}" y="${y}" width="${width}" height="${height}" 
              fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"/>
        
        <!-- Label at top -->
        <text x="${x + 10}" y="${y + fontSize + 5}" 
              font-size="${fontSize}" font-family="Arial" font-weight="bold"
              fill="${textColor}">
          ${this.label}
        </text>

        <!-- Children -->
        ${childrenSVG}
      </g>
    `
  }
}
