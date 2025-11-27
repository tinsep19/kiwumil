// src/plugin/core/symbols/circle_symbol.ts
import type { LayoutConstraintBuilder } from "../../../layout/layout_constraints"
import { SymbolBase, type SymbolBaseOptions } from "../../../model/symbol_base"
import { getStyleForSymbol } from "../../../theme"
import type { Point } from "../../../model/types"
import { getBoundsValues } from "../../../layout/bounds"

export interface CircleSymbolOptions extends SymbolBaseOptions {
  label: string
}

export class CircleSymbol extends SymbolBase {
  readonly label: string

  constructor(options: CircleSymbolOptions) {
    super(options)
    this.label = options.label
  }

  getDefaultSize() {
    return { width: 60, height: 60 }
  }

  getConnectionPoint(from: Point): Point {
    const { x, y, width, height } = getBoundsValues(this.layout)

    const cx = x + width / 2
    const cy = y + height / 2
    const r = Math.min(width, height) / 2

    const dx = from.x - cx
    const dy = from.y - cy
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance === 0) {
      return { x: cx + r, y: cy }
    }

    return {
      x: cx + (dx / distance) * r,
      y: cy + (dy / distance) * r,
    }
  }

  toSVG(): string {
    const { x, y, width, height } = getBoundsValues(this.layout)

    const cx = x + width / 2
    const cy = y + height / 2
    const r = Math.min(width, height) / 2

    const style = this.theme
      ? getStyleForSymbol(this.theme, "circle")
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
        <!-- Circle -->
        <circle cx="${cx}" cy="${cy}" r="${r}" 
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

  ensureLayoutBounds(_builder: LayoutConstraintBuilder): void {
    // no additional constraints
  }
}
