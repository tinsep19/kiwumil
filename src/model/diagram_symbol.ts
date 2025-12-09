// src/model/diagram_symbol.ts
import { getStyleForSymbol } from "../theme"
import type { Theme } from "../theme"
import type { Point } from "./types"
import type { DiagramInfo } from "./diagram_info"
import type { ContainerBounds, ConstraintsBuilder } from "../layout"
import { getBoundsValues } from "../layout"
import { SymbolBase, type SymbolBaseOptions } from "./symbol_base"
import { ContainerPadding, ContainerSymbol } from "./container_symbol"

export interface DiagramSymbolOptions extends SymbolBaseOptions {
  info: DiagramInfo
  container: ContainerBounds
}

export class DiagramSymbol extends SymbolBase implements ContainerSymbol {
  readonly container: ContainerBounds

  private readonly diagramInfo: DiagramInfo
  private constraintsApplied = false

  constructor(options: DiagramSymbolOptions) {
    super(options)
    this.container = options.container
    this.diagramInfo = options.info
  }

  getDefaultSize() {
    return { width: 200, height: 150 }
  }

  protected getContainerPadding(theme: Theme): ContainerPadding {
    const horizontal = theme.defaultStyleSet.horizontalGap / 2
    const vertical = theme.defaultStyleSet.verticalGap / 2
    return {
      top: vertical,
      right: horizontal,
      bottom: vertical,
      left: horizontal,
    }
  }

  protected getHeaderHeight(theme: Theme): number {
    return theme.defaultStyleSet.verticalGap
  }

  private buildContainerConstraints(builder: ConstraintsBuilder): void {
    const bounds = this.layout
    const padding = this.getContainerPadding(this.theme)
    const header = this.getHeaderHeight(this.theme)
    const horizontalPadding = padding.left + padding.right
    const verticalPadding = padding.top + padding.bottom + header

    builder
      .expr([1, this.container.x])
      .eq([1, bounds.x], [padding.left, 1])
      .strong()
    builder
      .expr([1, this.container.y])
      .eq([1, bounds.y], [padding.top + header, 1])
      .strong()
    builder
      .expr([1, this.container.width])
      .eq([1, bounds.width], [-horizontalPadding, 1])
      .strong()
    builder
      .expr([1, this.container.height])
      .eq([1, bounds.height], [-verticalPadding, 1])
      .strong()
  }

  ensureLayoutBounds(builder: ConstraintsBuilder): void {
    this.buildContainerConstraints(builder)
    if (this.constraintsApplied) {
      return
    }
    const bounds = this.layout
    builder.expr([1, bounds.x]).eq([0, 1]).strong()
    builder.expr([1, bounds.y]).eq([0, 1]).strong()
    builder.expr([1, bounds.width]).ge([200, 1]).weak()
    builder.expr([1, bounds.height]).ge([150, 1]).weak()
    this.constraintsApplied = true
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

    const cx = x + width / 2

    const style = this.theme
      ? getStyleForSymbol(this.theme, "rectangle")
      : {
          strokeColor: "#e0e0e0",
          strokeWidth: 1,
          fillColor: "white",
          textColor: "black",
          fontSize: 12,
          fontFamily: "Arial",
          backgroundColor: "white",
          horizontalGap: 80,
          verticalGap: 50,
        }

    const titleFontSize = style.fontSize * 1.5
    const metaFontSize = style.fontSize * 0.75

    let metaText = ""
    if (this.diagramInfo.createdAt && this.diagramInfo.author) {
      metaText = `Created: ${this.diagramInfo.createdAt} | Author: ${this.diagramInfo.author}`
    } else if (this.diagramInfo.createdAt) {
      metaText = `Created: ${this.diagramInfo.createdAt}`
    } else if (this.diagramInfo.author) {
      metaText = `Author: ${this.diagramInfo.author}`
    }

    return `
      <g id="${this.id}">
        <!-- Title -->
        <text x="${cx}" y="${y + 30}" 
              text-anchor="middle" 
              font-size="${titleFontSize}" 
              font-weight="bold"
              font-family="${style.fontFamily}"
              fill="${style.textColor}">
          ${this.diagramInfo.title}
        </text>
        ${
          metaText
            ? `
        <!-- Metadata -->
        <text x="${x + width - 10}" y="${y + height - 10}" 
              text-anchor="end" 
              font-size="${metaFontSize}" 
              font-family="${style.fontFamily}"
              fill="${style.textColor}"
              opacity="0.5">
          ${metaText}
        </text>`
            : ""
        }
      </g>
    `
  }
}
