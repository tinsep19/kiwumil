// src/plugin/uml/symbols/actor_symbol.ts
import type { ConstraintsBuilder } from "../../../layout"
import { SymbolBase, type SymbolBaseOptions } from "../../../model"
import { getStyleForSymbol } from "../../../theme"
import type { Point } from "../../../core/symbols"
import { getBoundsValues } from "../../../layout"

export interface ActorSymbolOptions extends SymbolBaseOptions {
  label: string
}

export class ActorSymbol extends SymbolBase {
  readonly label: string

  constructor(options: ActorSymbolOptions) {
    super(options)
    this.label = options.label
  }

  getDefaultSize() {
    return { width: 60, height: 80 }
  }

  getConnectionPoint(from: Point): Point {
    const { x, y, width, height } = getBoundsValues(this.layout)

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
    const { x, y, width, height } = getBoundsValues(this.layout)

    // 負の値や極端に小さい値を安全な値にクランプ（二次防御）
    const safeWidth = Math.max(10, Math.abs(width))
    const safeHeight = Math.max(20, Math.abs(height))

    const cx = x + safeWidth / 2
    // 半径を計算し、最小値でクランプ
    const headRadius = Math.max(2, safeWidth / 6)
    const bodyTop = y + headRadius * 2 + 5
    const bodyBottom = y + safeHeight * 0.6
    const armY = bodyTop + (bodyBottom - bodyTop) * 0.3
    const legBottom = y + safeHeight - 15

    // テーマからスタイルを取得
    const style = this.theme
      ? getStyleForSymbol(this.theme, "actor")
      : {
          strokeColor: "black",
          strokeWidth: 2,
          textColor: "black",
          fontSize: 12,
          fontFamily: "Arial",
          fillColor: "white",
          backgroundColor: "white",
          horizontalGap: 80,
          verticalGap: 50,
        }

    return `
      <g id="${this.id}">
        <!-- Head -->
        <circle cx="${cx}" cy="${y + headRadius + 5}" r="${headRadius}" 
                fill="none" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/>
        
        <!-- Body -->
        <line x1="${cx}" y1="${bodyTop}" x2="${cx}" y2="${bodyBottom}" 
              stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/>
        
        <!-- Arms -->
        <line x1="${x + 5}" y1="${armY}" x2="${x + safeWidth - 5}" y2="${armY}" 
              stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/>
        
        <!-- Legs -->
        <line x1="${cx}" y1="${bodyBottom}" x2="${x + 10}" y2="${legBottom}" 
              stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/>
        <line x1="${cx}" y1="${bodyBottom}" x2="${x + safeWidth - 10}" y2="${legBottom}" 
              stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/>
        
        <!-- Label -->
        <text x="${cx}" y="${y + safeHeight}" 
              text-anchor="middle" font-size="${style.fontSize}" font-family="${style.fontFamily}"
              fill="${style.textColor}">
          ${this.label}
        </text>
      </g>
    `
  }

  ensureLayoutBounds(_builder: ConstraintsBuilder): void {
    // Controller constraints handled elsewhere
  }
}
