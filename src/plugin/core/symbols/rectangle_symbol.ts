// src/plugin/core/symbols/rectangle_symbol.ts
import type { LinearConstraintBuilder, ISymbol, SymbolId, LayoutBounds } from "../../../core"
import { getStyleForSymbol } from "../../../theme"
import type { Point } from "../../../core"
import { getBoundsValues } from "../../../core"
import type { Theme } from "../../../theme"

export interface RectangleSymbolOptions {
  id: SymbolId
  bounds: LayoutBounds
  theme: Theme
  label: string
}

export class RectangleSymbol implements ISymbol {
  readonly id: SymbolId
  readonly bounds: LayoutBounds
  protected readonly theme: Theme
  readonly label: string

  constructor(options: RectangleSymbolOptions) {
    this.id = options.id
    this.bounds = options.bounds
    this.theme = options.theme
    this.label = options.label
  }

  getDefaultSize() {
    return { width: 120, height: 60 }
  }

  getConnectionPoint(from: Point): Point {
    const { x, y, width, height } = getBoundsValues(this.bounds)

    const cx = x + width / 2
    const cy = y + height / 2

    const dx = from.x - cx
    const dy = from.y - cy

    const halfWidth = width / 2
    const halfHeight = height / 2

    if (dx === 0 && dy === 0) {
      return { x: cx + halfWidth, y: cy }
    }

    const tx = dx !== 0 ? halfWidth / Math.abs(dx) : Infinity
    const ty = dy !== 0 ? halfHeight / Math.abs(dy) : Infinity

    const t = Math.min(tx, ty)

    return {
      x: cx + dx * t,
      y: cy + dy * t,
    }
  }

  toSVG(): string {
    const { x, y, width, height } = getBoundsValues(this.bounds)

    const cx = x + width / 2
    const cy = y + height / 2

    const style = this.theme
      ? getStyleForSymbol(this.theme, "rectangle")
      : {
          strokeColor: "black",
          strokeWidth: 2,
          fillColor: "white",
          textColor: "black",
          fontSize: 12,
          fontFamily: "Arial",
          backgroundColor: "white",
          horizontalGap: 80,
          verticalGap: 50,
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
              font-family="${style.fontFamily}"
              fill="${style.textColor}">
          ${this.label}
        </text>
      </g>
    `
  }

  ensureLayoutBounds(builder: LinearConstraintBuilder): void {
    // Add minimum size constraints (weak) so symbols have a default size
    const defaultSize = this.getDefaultSize()
    builder.ct([1, this.bounds.width]).ge([defaultSize.width, 1]).weak()
    builder.ct([1, this.bounds.height]).ge([defaultSize.height, 1]).weak()
  }

  /**
   * ISymbol interface implementation - delegates to toSVG()
   */
  render(): string {
    return this.toSVG()
  }
}
