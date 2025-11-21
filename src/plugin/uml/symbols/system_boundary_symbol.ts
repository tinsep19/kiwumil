// src/plugin/uml/symbols/system_boundary_symbol.ts
import { ContainerSymbolBase, type ContainerPadding } from "../../../model/container_symbol_base"
import { getStyleForSymbol } from "../../../theme"
import type { Point, ContainerSymbolId } from "../../../model/types"
import type { LayoutContext } from "../../../layout/layout_context"
import type { Theme } from "../../../theme"

export class SystemBoundarySymbol extends ContainerSymbolBase {
  defaultWidth = 300
  defaultHeight = 200

  constructor(id: ContainerSymbolId, label: string, layout: LayoutContext) {
    super(id, label, layout)
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
      left: horizontal
    }
  }

  protected override getHeaderHeight(theme: Theme): number {
    return theme.defaultStyleSet.verticalGap / 2
  }

  private applyMinSize() {
    this.layout.applyMinSize(this, this.getDefaultSize())
  }

  getConnectionPoint(from: Point): Point {
    if (!this.bounds) {
      throw new Error(`SystemBoundary ${this.id} has no bounds`)
    }

    const cx = this.bounds.x + this.bounds.width / 2
    const cy = this.bounds.y + this.bounds.height / 2

    const dx = from.x - cx
    const dy = from.y - cy

    const halfWidth = this.bounds.width / 2
    const halfHeight = this.bounds.height / 2

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
    if (!this.bounds) {
      throw new Error(`SystemBoundary ${this.id} has no bounds`)
    }

    const { x, y, width, height } = this.bounds

    // テーマからスタイルを取得
    const style = this.theme ? getStyleForSymbol(this.theme, 'systemBoundary') : {
      strokeColor: '#999',
      strokeWidth: 2,
      fillColor: '#f8f8f8',
      textColor: 'black',
      fontSize: 14,
      fontFamily: 'Arial',
      backgroundColor: '#f8f8f8',
      horizontalGap: 80,
      verticalGap: 50
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
