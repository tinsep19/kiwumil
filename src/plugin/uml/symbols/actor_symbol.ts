// src/plugin/uml/symbols/actor_symbol.ts
import type { IConstraintsBuilder } from "../../../layout"
import { SymbolBase, type SymbolBaseOptions } from "../../../model"
import { getStyleForSymbol } from "../../../theme"
import type { Point } from "../../../core"
import { getBoundsValues } from "../../../layout"
import type { IconMeta } from "../../../icon"

export interface ActorSymbolOptions extends SymbolBaseOptions {
  label: string
  stereotype?: string
  icon?: IconMeta | null
}

export class ActorSymbol extends SymbolBase {
  readonly label: string
  readonly stereotype?: string
  readonly icon?: IconMeta | null

  constructor(options: ActorSymbolOptions) {
    super(options)
    this.label = options.label
    this.stereotype = options.stereotype
    this.icon = options.icon
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

    let bodyContent = ""
    
    if (this.icon?.raw) {
      // Use icon if available
      // Scale and position the icon to fit in the upper part of the bounds
      const iconHeight = safeHeight * 0.7
      const iconWidth = safeWidth * 0.8
      const iconX = x + (safeWidth - iconWidth) / 2
      const iconY = y + 5
      
      bodyContent = `
        <g transform="translate(${iconX}, ${iconY}) scale(${iconWidth / 60}, ${iconHeight / 60})">
          ${this.icon.raw}
        </g>
      `
    } else {
      // Fallback to stick figure
      const headRadius = Math.max(2, safeWidth / 6)
      const bodyTop = y + headRadius * 2 + 5
      const bodyBottom = y + safeHeight * 0.6
      const armY = bodyTop + (bodyBottom - bodyTop) * 0.3
      const legBottom = y + safeHeight - 15
      
      bodyContent = `
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
      `
    }

    // Add stereotype if present
    let stereotypeText = ""
    if (this.stereotype) {
      stereotypeText = `
        <text x="${cx}" y="${y + safeHeight - 15}" 
              text-anchor="middle" font-size="${style.fontSize}" font-family="${style.fontFamily}"
              fill="${style.textColor}">
          &lt;&lt;${this.stereotype}&gt;&gt;
        </text>
      `
    }

    return `
      <g id="${this.id}">
        ${bodyContent}
        ${stereotypeText}
        <!-- Label -->
        <text x="${cx}" y="${y + safeHeight}" 
              text-anchor="middle" font-size="${style.fontSize}" font-family="${style.fontFamily}"
              fill="${style.textColor}">
          ${this.label}
        </text>
      </g>
    `
  }

  ensureLayoutBounds(_builder: IConstraintsBuilder): void {
    // Controller constraints handled elsewhere
  }
}
