// src/plugin/uml/symbols/system_boundary_symbol.ts
import { getStyleForSymbol } from "../../../theme"
import type { Point } from "../../../model/types"
import { getBoundsValues } from "../../../layout/bounds"
import type { ContainerBounds, LayoutBounds } from "../../../layout/bounds"
import type { Theme } from "../../../theme"
import { LayoutConstraintStrength } from "../../../layout/layout_variables"
import { finalizeConstraint } from "../../../layout/constraint_helpers"
import type { ConstraintsBuilder } from "../../../layout/constraints_builder"
import { SymbolBase, type SymbolBaseOptions } from "../../../model/symbol_base"
import { ContainerSymbol, type ContainerPadding } from "../../../model/container_symbol"

export interface SystemBoundarySymbolOptions extends SymbolBaseOptions {
  label: string
  container: ContainerBounds
}

type BoundsAxis = "x" | "y" | "width" | "height"

export class SystemBoundarySymbol extends SymbolBase implements ContainerSymbol {
  readonly label: string
  readonly container: ContainerBounds

  private readonly defaultWidth = 300
  private readonly defaultHeight = 200
  private constraintsApplied = false

  constructor(options: SystemBoundarySymbolOptions) {
    super(options)
    this.container = options.container
    this.label = options.label
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

  private buildContainerConstraints(builder: ConstraintsBuilder): void {
    const bounds = this.layout
    const theme = this.theme
    const padding = this.getContainerPadding(theme)
    const header = this.getHeaderHeight(theme)
    const horizontalPadding = padding.left + padding.right
    const verticalPadding = padding.top + padding.bottom + header

    finalizeConstraint(
      builder
        .expr([1, this.container.x])
        .eq([1, bounds.x], [padding.left, 1]),
      LayoutConstraintStrength.Strong
    )
    finalizeConstraint(
      builder
        .expr([1, this.container.y])
        .eq([1, bounds.y], [padding.top + header, 1]),
      LayoutConstraintStrength.Strong
    )
    finalizeConstraint(
      builder
        .expr([1, this.container.width])
        .eq([1, bounds.width], [-horizontalPadding, 1]),
      LayoutConstraintStrength.Strong
    )
    finalizeConstraint(
      builder
        .expr([1, this.container.height])
        .eq([1, bounds.height], [-verticalPadding, 1]),
      LayoutConstraintStrength.Strong
    )
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

  ensureLayoutBounds(builder: ConstraintsBuilder): void {
    this.buildContainerConstraints(builder)
    if (this.constraintsApplied) {
      return
    }
    const bounds = this.layout
    finalizeConstraint(
      builder.expr([1, bounds.width]).ge([this.defaultWidth, 1]),
      LayoutConstraintStrength.Weak
    )
    finalizeConstraint(
      builder.expr([1, bounds.height]).ge([this.defaultHeight, 1]),
      LayoutConstraintStrength.Weak
    )
    this.constraintsApplied = true
  }

  toSVG(): string {
    const { x, y, width, height } = getBoundsValues(this.layout)

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
