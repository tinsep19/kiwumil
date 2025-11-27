// src/plugin/uml/symbols/system_boundary_symbol.ts
import { getStyleForSymbol } from "../../../theme"
import type { Point } from "../../../model/types"
import { getBoundsValues } from "../../../layout/bounds"
import type { Bounds } from "../../../layout/bounds"
import type { LayoutContext } from "../../../layout/layout_context"
import type { Theme } from "../../../theme"
import { LayoutConstraintStrength } from "../../../layout/layout_variables"
import type { LayoutConstraintBuilder } from "../../../layout/layout_constraints"
import { SymbolBase, type SymbolBaseOptions } from "../../../model/symbol_base"
import { ContainerSymbol, type ContainerPadding } from "../../../model/container_symbol"

export interface SystemBoundarySymbolOptions extends SymbolBaseOptions {
  label: string
}

export class SystemBoundarySymbol extends SymbolBase implements ContainerSymbol {
  readonly label: string
  readonly container: Bounds

  private readonly layout: LayoutContext
  private readonly defaultWidth = 300
  private readonly defaultHeight = 200
  private constraintsApplied = false

  constructor(options: SystemBoundarySymbolOptions, layout: LayoutContext) {
    super(options)
    this.layout = layout
    this.container = layout.variables.createBound(`${this.id}.container`, "container")
    this.label = options.label
    this.registerContainerConstraints()
    this.applyMinSize()
  }

  getDefaultSize() {
    return { width: this.defaultWidth, height: this.defaultHeight }
  }

  protected getContainerPadding(theme: Theme): ContainerPadding {
    const horizontal = theme.defaultStyleSet.horizontalGap / 3
    const vertical = theme.defaultStyleSet.verticalGap / 3
    return {
      top: vertical,
      right: horizontal,
      bottom: vertical,
      left: horizontal,
    }
  }

  protected getHeaderHeight(theme: Theme): number {
    return theme.defaultStyleSet.verticalGap / 2
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

  private applyMinSize() {
    if (this.constraintsApplied) {
      return
    }
    this.layout.applyMinSize(this, this.getDefaultSize())
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

    const style = this.theme
      ? getStyleForSymbol(this.theme, "systemBoundary")
      : {
          strokeColor: "#999",
          strokeWidth: 2,
          fillColor: "#f8f8f8",
          textColor: "black",
          fontSize: 14,
          fontFamily: "Arial",
          backgroundColor: "#f8f8f8",
          horizontalGap: 80,
          verticalGap: 50,
        }

    return `
      <g id="${this.id}">
        <!-- System Boundary Rectangle -->
        <rect x="${x}" y="${y}" width="${width}" height="${height}" 
              fill="${style.fillColor}" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/>
        
        <!-- Label at top -->
        <text x="${x + 10}" y="${y + style.fontSize + 5}" 
              font-size="${style.fontSize}" font-family="${style.fontFamily}" font-weight="bold"
              fill="${style.textColor}">
          ${this.label}
        </text>
      </g>
    `
  }
}
