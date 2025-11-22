// src/model/diagram_symbol.ts
import { ContainerSymbolBase, type ContainerPadding } from "./container_symbol_base"
import { getStyleForSymbol } from "../theme"
import type { Theme } from "../theme"
import type { Point, ContainerSymbolId } from "./types"
import type { DiagramInfo } from "./diagram_info"
import type { LayoutBound } from "../layout/layout_bound"
import type { LayoutConstraintBuilder } from "../layout/layout_constraints"
import type { LayoutContext } from "../layout/layout_context"
import { LayoutConstraintStrength } from "../layout/layout_variables"
import { getBoundsValues } from "../layout/layout_bound"

export class DiagramSymbol extends ContainerSymbolBase {
  private diagramInfo: DiagramInfo
  private constraintsApplied = false

  constructor(id: ContainerSymbolId, titleOrInfo: string | DiagramInfo, layoutBounds: LayoutBound, layout: LayoutContext) {
    const info = typeof titleOrInfo === "string"
      ? { title: titleOrInfo }
      : titleOrInfo
    super(id, info.title, layoutBounds, layout)
    this.diagramInfo = info
    this.applyDiagramConstraints()
  }

  getDefaultSize() {
    return { width: 200, height: 150 }
  }

  override ensureLayoutBounds(builder?: LayoutConstraintBuilder): LayoutBound {
    const bounds = super.ensureLayoutBounds(builder)
    this.applyDiagramConstraints()
    return bounds
  }

  protected getContainerPadding(theme: Theme): ContainerPadding {
    const horizontal = theme.defaultStyleSet.horizontalGap / 2
    const vertical = theme.defaultStyleSet.verticalGap / 2
    return {
      top: vertical,
      right: horizontal,
      bottom: vertical,
      left: horizontal
    }
  }

  protected override getHeaderHeight(theme: Theme): number {
    return theme.defaultStyleSet.verticalGap
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
      y: cy + dy * t
    }
  }

  toSVG(): string {
    const { x, y, width, height } = getBoundsValues(this.getLayoutBounds())

    const cx = x + width / 2

    const style = this.theme ? getStyleForSymbol(this.theme, "rectangle") : {
      strokeColor: "#e0e0e0",
      strokeWidth: 1,
      fillColor: "white",
      textColor: "black",
      fontSize: 12,
      fontFamily: "Arial",
      backgroundColor: "white",
      horizontalGap: 80,
      verticalGap: 50
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
        ${metaText ? `
        <!-- Metadata -->
        <text x="${x + width - 10}" y="${y + height - 10}" 
              text-anchor="end" 
              font-size="${metaFontSize}" 
              font-family="${style.fontFamily}"
              fill="${style.textColor}"
              opacity="0.5">
          ${metaText}
        </text>` : ""}
      </g>
    `
  }
}
