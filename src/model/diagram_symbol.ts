// src/model/diagram_symbol.ts
import { getStyleForSymbol } from "../theme"
import type { Theme } from "../theme"
import type { Point } from "./types"
import type { DiagramInfo } from "./diagram_info"
import type { Bounds } from "../layout/bounds"
import type { LayoutContext } from "../layout/layout_context"
import type { LayoutConstraintBuilder } from "../layout/layout_constraints"
import { LayoutConstraintStrength } from "../layout/layout_variables"
import { getBoundsValues } from "../layout/bounds"
import { SymbolBase, type SymbolBaseOptions } from "./symbol_base"
import { ContainerPadding, ContainerSymbol } from "./container_symbol"

export interface DiagramSymbolOptions extends SymbolBaseOptions {
  info: DiagramInfo
}

export class DiagramSymbol extends SymbolBase implements ContainerSymbol {
  readonly container: Bounds

  private readonly layout: LayoutContext
  private readonly diagramInfo: DiagramInfo
  private constraintsApplied = false

  constructor(options: DiagramSymbolOptions, layout: LayoutContext) {
    super(options)
    this.layout = layout
    this.container = layout.variables.createBound(`${this.id}.container`, "container")
    this.diagramInfo = options.info
    this.registerContainerConstraints()
    this.applyDiagramConstraints()
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

  private registerContainerConstraints() {
    this.layout.constraints.withSymbol(this.id, "containerInbounds", (builder) => {
      this.ensureLayoutBounds(builder)
      this.buildContainerConstraints(builder)
    })
  }

  private buildContainerConstraints(builder: LayoutConstraintBuilder): void {
    const bounds = this.getLayoutBounds()
    const theme = this.theme ?? this.layout.theme
    const padding = this.getContainerPadding(theme)
    const header = this.getHeaderHeight(theme)
    const horizontalPadding = padding.left + padding.right
    const verticalPadding = padding.top + padding.bottom + header

    builder.eq(
      this.container.x,
      this.layout.expressionFromBounds(bounds, [{ axis: "x" }], padding.left),
      LayoutConstraintStrength.Strong
    )
    builder.eq(
      this.container.y,
      this.layout.expressionFromBounds(bounds, [{ axis: "y" }], padding.top + header),
      LayoutConstraintStrength.Strong
    )
    builder.eq(
      this.container.width,
      this.layout.expressionFromBounds(bounds, [{ axis: "width" }], -horizontalPadding),
      LayoutConstraintStrength.Strong
    )
    builder.eq(
      this.container.height,
      this.layout.expressionFromBounds(bounds, [{ axis: "height" }], -verticalPadding),
      LayoutConstraintStrength.Strong
    )
  }

  private applyDiagramConstraints() {
    if (this.constraintsApplied) {
      return
    }
    this.layout.anchorToOrigin(this, LayoutConstraintStrength.Strong)
    this.layout.applyMinSize(this, { width: 200, height: 150 }, LayoutConstraintStrength.Weak)
    this.constraintsApplied = true
  }

  getConnectionPoint(from: Point): Point {
    const { x, y, width, height } = getBoundsValues(this.getLayoutBounds())

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
    const { x, y, width, height } = getBoundsValues(this.getLayoutBounds())

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
