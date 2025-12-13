// src/plugin/uml/symbols/actor_symbol.ts
import type { LinearConstraintBuilder } from "../../../core"
import { SymbolBase, type SymbolBaseOptions } from "../../../model/symbol_base"
import { getStyleForSymbol } from "../../../theme"
import type { Point } from "../../../core"
import { getBoundsValues } from "../../../core"
import type { IconMeta } from "../../../icon"

// Icon size constant
const ICON_BASE_SIZE = 60

export interface ActorSymbolOptions extends SymbolBaseOptions {
  label: string
  stereotype?: string
  icon?: IconMeta | null
}

/**
 * Escape XML/HTML special characters to prevent XSS
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
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

    // Get style from theme
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

    // Reserve space above the figure when stereotype is present
    const stereotypeHeight = this.stereotype ? style.fontSize + 5 : 0
    const actorStartY = y + stereotypeHeight
    
    // Icon is required - throw error if not available
    if (!this.icon?.raw) {
      throw new Error(`Actor icon is required but not available for symbol ${this.id}`)
    }
    
    // Use icon at fixed size (no scaling)
    const iconX = x + (safeWidth - ICON_BASE_SIZE) / 2
    const iconY = actorStartY + 5
    
    const bodyContent = `
      <g transform="translate(${iconX}, ${iconY})">
        ${this.icon.raw}
      </g>
    `

    // Add stereotype if present (above the actor figure)
    let stereotypeText = ""
    if (this.stereotype) {
      const escapedStereotype = escapeXml(this.stereotype)
      stereotypeText = `
        <text x="${cx}" y="${y + style.fontSize}" 
              text-anchor="middle" font-size="${style.fontSize}" font-family="${style.fontFamily}"
              fill="${style.textColor}">
          &lt;&lt;${escapedStereotype}&gt;&gt;
        </text>
      `
    }

    const escapedLabel = escapeXml(this.label)
    
    return `
      <g id="${this.id}">
        ${stereotypeText}
        ${bodyContent}
        <!-- Label -->
        <text x="${cx}" y="${y + safeHeight}" 
              text-anchor="middle" font-size="${style.fontSize}" font-family="${style.fontFamily}"
              fill="${style.textColor}">
          ${escapedLabel}
        </text>
      </g>
    `
  }

  ensureLayoutBounds(_builder: LinearConstraintBuilder): void {
    // Controller constraints handled elsewhere
  }
}
