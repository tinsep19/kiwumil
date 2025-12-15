// src/plugin/core/symbols/circle_symbol.ts
import type { LinearConstraintBuilder, LayoutVariable, ISymbolCharacs } from "../../../core"
import { SymbolBase, type SymbolBaseOptions } from "../../../model/symbol_base"
import { getStyleForSymbol } from "../../../theme"
import type { Point } from "../../../core"
import { getBoundsValues } from "../../../core"

/**
 * ICircleSymbolCharacs: 円形シンボルの特性
 * ISymbolCharacs を拡張し、半径 r プロパティを必須にする
 */
export interface ICircleSymbolCharacs extends ISymbolCharacs {
  r: LayoutVariable
}

export interface CircleSymbolOptions extends SymbolBaseOptions {
  label: string
  r: LayoutVariable
}

export class CircleSymbol extends SymbolBase {
  readonly label: string
  readonly r: LayoutVariable

  constructor(options: CircleSymbolOptions) {
    super(options)
    this.label = options.label
    this.r = options.r
  }

  getDefaultSize() {
    return { width: 60, height: 60 }
  }

  getConnectionPoint(from: Point): Point {
    const { x, y, width, height } = getBoundsValues(this.bounds)

    const cx = x + width / 2
    const cy = y + height / 2
    const radius = this.r.value()

    const dx = from.x - cx
    const dy = from.y - cy
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance === 0) {
      return { x: cx + radius, y: cy }
    }

    return {
      x: cx + (dx / distance) * radius,
      y: cy + (dy / distance) * radius,
    }
  }

  toSVG(): string {
    const { x, y, width, height } = getBoundsValues(this.bounds)

    const cx = x + width / 2
    const cy = y + height / 2
    const radius = this.r.value()

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
        <circle cx="${cx}" cy="${cy}" r="${radius}" 
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
    // r = min(width, height) / 2
    // Since we can't express min() directly in constraints, we'll use:
    // r * 2 <= width and r * 2 <= height
    const { width, height } = this.bounds
    builder.expr([2, this.r]).le([1, width])
    builder.expr([2, this.r]).le([1, height])
  }
}
