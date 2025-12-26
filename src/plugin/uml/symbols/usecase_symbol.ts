// src/plugin/uml/symbols/usecase_symbol.ts
import type { LinearConstraintBuilder, Variable, ISymbolCharacs } from "../../../core"
import { SymbolBase, type SymbolBaseOptions } from "../../../model"
import { getStyleForSymbol } from "../../../theme"
import type { Point } from "../../../core"
import { getBoundsValues } from "../../../core"

/**
 * IUsecaseSymbolCharacs: ユースケースシンボルの特性
 * ISymbolCharacs を拡張し、rx と ry プロパティを必須にする
 */
export type IUsecaseSymbolCharacs = ISymbolCharacs<{ rx: Variable; ry: Variable }>

export interface UsecaseSymbolOptions extends SymbolBaseOptions {
  label: string
  rx: Variable
  ry: Variable
}

export class UsecaseSymbol extends SymbolBase {
  readonly label: string
  readonly rx: Variable
  readonly ry: Variable

  constructor(options: UsecaseSymbolOptions) {
    super(options)
    this.label = options.label
    this.rx = options.rx
    this.ry = options.ry
  }

  getDefaultSize() {
    return { width: 120, height: 60 }
  }

  getConnectionPoint(from: Point): Point {
    const { x, y, width, height } = getBoundsValues(this.bounds)

    const cx = x + width / 2
    const cy = y + height / 2
    const rx = this.rx.value()
    const ry = this.ry.value()

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

    // 負の値や極端に小さい値を安全な値にクランプ（二次防御）
    const safeWidth = Math.max(10, Math.abs(width))
    const safeHeight = Math.max(10, Math.abs(height))

    const cx = x + safeWidth / 2
    const cy = y + safeHeight / 2
    
    // rx, ry を線形変数から取得し、最小値でクランプ
    const rx = Math.max(2, this.rx.value())
    const ry = Math.max(2, this.ry.value())

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

  ensureLayoutBounds(builder: LinearConstraintBuilder): void {
    // rx and ry are linear free variables constrained by the bounds dimensions
    // The ellipse should fit within the layout bounds: rx * 2 <= width and ry * 2 <= height
    const { width, height } = this.bounds
    builder.ct([2, this.rx]).le([1, width])
    builder.ct([2, this.ry]).le([1, height])
    
    // For proper ellipse sizing, we want rx and ry to approximately fill the bounds
    // Using sin(π/4) = 1/√2 for the π/4 direction constraint
    // This ensures the ellipse properly fits the rectangular bounds
    const sinPi4 = Math.sin(Math.PI / 4)
    // rx should be approximately width/2 and ry should be approximately height/2
    // Using weak constraints to allow flexibility
    builder.ct([1, this.rx]).eq([0.5, width]).weak()
    builder.ct([1, this.ry]).eq([0.5, height]).weak()
  }
}
