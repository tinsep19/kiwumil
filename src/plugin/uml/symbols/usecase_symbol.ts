// src/plugin/uml/symbols/usecase_symbol.ts
import type { IConstraintsBuilder } from "../../../layout"
import { SymbolBase, type SymbolBaseOptions } from "../../../model"
import { getStyleForSymbol } from "../../../theme"
import type { Point } from "../../../core/symbols"
import { getBoundsValues } from "../../../layout"

export interface UsecaseSymbolOptions extends SymbolBaseOptions {
  label: string
}

export class UsecaseSymbol extends SymbolBase {
  readonly label: string

  constructor(options: UsecaseSymbolOptions) {
    super(options)
    this.label = options.label
  }

  getDefaultSize() {
    return { width: 120, height: 60 }
  }

  getConnectionPoint(from: Point): Point {
    const { x, y, width, height } = getBoundsValues(this.layout)

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
    const { x, y, width, height } = getBoundsValues(this.layout)

    // 負の値や極端に小さい値を安全な値にクランプ（二次防御）
    const safeWidth = Math.max(10, Math.abs(width))
    const safeHeight = Math.max(10, Math.abs(height))

    const cx = x + safeWidth / 2
    const cy = y + safeHeight / 2
    // rx, ry を計算し、最小値でクランプ
    const rx = Math.max(2, safeWidth / 2)
    const ry = Math.max(2, safeHeight / 2)

    // テーマからスタイルを取得
    const style = this.theme
      ? getStyleForSymbol(this.theme, "usecase")
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
                 fill="${style.fillColor}" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/>
        
        <!-- Label -->
        <text x="${cx}" y="${cy + 5}" 
              text-anchor="middle" font-size="${style.fontSize}" font-family="${style.fontFamily}"
              fill="${style.textColor}">
          ${this.label}
        </text>
      </g>
    `
  }

  ensureLayoutBounds(_builder: IConstraintsBuilder): void {
    // Constraints managed externally
  }
}
