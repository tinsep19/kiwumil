import { getStyleForSymbol } from "../theme"
import type { Theme, ContainerPadding } from "../theme"
import type { Point, ISymbol, SymbolId, LayoutBounds, ISymbolCharacs } from "../core"
export interface DiagramInfo {
  title: string
  createdAt?: string
  author?: string
}

import type { ContainerBounds, LinearConstraintBuilder, ItemBounds } from "../core"
import { getBoundsValues } from "../core"
import { ConstraintHelper } from "../hint"
import { TextItem } from "../item"

const DEFAULT_TEXT_ITEM_HEIGHT = 20

export type DiagramSymbolCharacs = ISymbolCharacs<{
  container: ContainerBounds
  title: ItemBounds
  author?: ItemBounds
  createdAt?: ItemBounds
}>

export interface DiagramSymbolOptions {
  info: DiagramInfo
  characs: DiagramSymbolCharacs
  theme: Theme
}

export class DiagramSymbol implements ISymbol {
  readonly id: SymbolId
  readonly bounds: LayoutBounds
  readonly container: ContainerBounds
  protected readonly theme: Theme

  private readonly diagramInfo: DiagramInfo
  private readonly items: { title: TextItem; author?: TextItem; createdAt?: TextItem }
  private constraintsApplied = false

  constructor(options: DiagramSymbolOptions) {
    this.id = options.characs.id
    this.bounds = options.characs.bounds
    this.container = options.characs.container
    this.theme = options.theme
    this.diagramInfo = options.info

    // Create TextItem for title
    const style = this.theme ? getStyleForSymbol(this.theme, "rectangle") : this.getFallbackStyle()
    const titleItem = new TextItem({
      bounds: options.characs.title,
      text: options.info.title,
      alignment: "center",
      fontSize: style.fontSize * 1.5,
      fontFamily: style.fontFamily,
      textColor: style.textColor,
      padding: { top: 8, right: 12, bottom: 8, left: 12 },
    })

    // Create TextItem for author if provided
    const authorItem = options.info.author && options.characs.author
      ? new TextItem({
          bounds: options.characs.author,
          text: `Author: ${options.info.author}`,
          alignment: "right",
          fontSize: style.fontSize * 0.75,
          fontFamily: style.fontFamily,
          textColor: style.textColor,
          padding: { top: 4, right: 10, bottom: 4, left: 10 },
        })
      : undefined

    // Create TextItem for createdAt if provided
    const createdAtItem = options.info.createdAt && options.characs.createdAt
      ? new TextItem({
          bounds: options.characs.createdAt,
          text: `Created: ${options.info.createdAt}`,
          alignment: "right",
          fontSize: style.fontSize * 0.75,
          fontFamily: style.fontFamily,
          textColor: style.textColor,
          padding: { top: 4, right: 10, bottom: 4, left: 10 },
        })
      : undefined

    this.items = { title: titleItem, author: authorItem, createdAt: createdAtItem }
  }

  private getFallbackStyle() {
    return {
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

  private buildContainerConstraints(builder: LinearConstraintBuilder): void {
    const bounds = this.bounds
    const padding = this.getContainerPadding(this.theme)
    const header = this.getHeaderHeight(this.theme)
    const horizontalPadding = padding.left + padding.right
    const verticalPadding = padding.top + padding.bottom + header

    builder.ct([1, this.container.x]).eq([1, bounds.x], [padding.left, 1]).strong()
    builder
      .ct([1, this.container.y])
      .eq([1, bounds.y], [padding.top + header, 1])
      .strong()
    builder.ct([1, this.container.width]).eq([1, bounds.width], [-horizontalPadding, 1]).strong()
    builder.ct([1, this.container.height]).eq([1, bounds.height], [-verticalPadding, 1]).strong()

    // Position title at the top center
    builder.ct([1, this.items.title.bounds.x]).eq([1, bounds.x]).strong()
    builder.ct([1, this.items.title.bounds.y]).eq([1, bounds.y], [padding.top, 1]).strong()
    builder.ct([1, this.items.title.bounds.width]).eq([1, bounds.width]).strong()

    // Position author and createdAt at the bottom right if they exist
    let bottomOffset = -padding.bottom
    if (this.items.createdAt) {
      builder.ct([1, this.items.createdAt.bounds.x]).eq([1, bounds.x]).strong()
      builder
        .ct([1, this.items.createdAt.bounds.bottom])
        .eq([1, bounds.bottom], [bottomOffset, 1])
        .strong()
      builder.ct([1, this.items.createdAt.bounds.width]).eq([1, bounds.width]).strong()
      // Update offset for author if both exist
      if (this.items.author) {
        bottomOffset -= this.items.createdAt.bounds.height.value() || DEFAULT_TEXT_ITEM_HEIGHT
      }
    }

    if (this.items.author) {
      builder.ct([1, this.items.author.bounds.x]).eq([1, bounds.x]).strong()
      builder
        .ct([1, this.items.author.bounds.bottom])
        .eq([1, bounds.bottom], [bottomOffset, 1])
        .strong()
      builder.ct([1, this.items.author.bounds.width]).eq([1, bounds.width]).strong()
    }
  }

  ensureLayoutBounds(builder: LinearConstraintBuilder): void {
    this.buildContainerConstraints(builder)
    if (this.constraintsApplied) {
      return
    }
    const bounds = this.bounds
    const helper = new ConstraintHelper(builder)

    // Fix DiagramSymbol's z to 0 (required)
    builder.ct([1, bounds.z]).eq([0, 1]).required()

    // Align z values between layout and container
    helper.align(bounds.z, this.container.z).required()

    builder.ct([1, bounds.x]).eq([0, 1]).strong()
    builder.ct([1, bounds.y]).eq([0, 1]).strong()
    builder.ct([1, bounds.width]).ge([200, 1]).weak()
    builder.ct([1, bounds.height]).ge([150, 1]).weak()
    this.constraintsApplied = true
  }

  getConnectionPoint(from: Point): Point {
    const { x, y, width, height } = getBoundsValues(this.bounds)

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
    return `
      <g id="${this.id}">
        <!-- Title -->
        ${this.items.title.render()}
        ${this.items.author ? `<!-- Author -->\n${this.items.author.render()}` : ""}
        ${this.items.createdAt ? `<!-- Created At -->\n${this.items.createdAt.render()}` : ""}
      </g>
    `
  }

  render(): string {
    return this.toSVG()
  }
}
