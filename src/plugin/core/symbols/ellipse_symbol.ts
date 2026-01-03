// src/plugin/core/symbols/ellipse_symbol.ts
import type { LinearConstraintBuilder, ISymbol, SymbolId, LayoutBounds } from "../../../core"
import { getStyleForSymbol } from "../../../theme"
import type { Point } from "../../../core"
import { getBoundsValues } from "../../../core"
import type { Theme } from "../../../theme"

export interface EllipseSymbolOptions {
  id: SymbolId
  bounds: LayoutBounds
  theme: Theme
  label: string
}

export class EllipseSymbol implements ISymbol {
  readonly id: SymbolId
  readonly bounds: LayoutBounds
  protected readonly theme: Theme
  readonly label: string

  constructor(options: EllipseSymbolOptions) {
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
    const rx = width / 2
    const ry = height / 2

    const dx = from.x - cx
    const dy = from.y - cy

    const angle = Math.atan2(dy, dx)

    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    }
  }

  toSVG(): string {
    const { x, y, width, height } = getBoundsValues(this.bounds)

    const cx = x + width / 2
    const cy = y + height / 2
    const rx = width / 2
    const ry = height / 2

    const style = this.theme
      ? getStyleForSymbol(this.theme, "ellipse")
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
        <!-- Ellipse -->
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" 
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

  ensureLayoutBounds(_builder: LinearConstraintBuilder): void {
    // no specific constraints
  }

  /**
   * ISymbol interface implementation - delegates to toSVG()
   */
  render(): string {
    return this.toSVG()
  }
}
