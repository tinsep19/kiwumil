import { getStyleForSymbol } from "../theme"
import type { Theme, ContainerPadding } from "../theme"
import type { Point, IContainerSymbolCharacs } from "../core"
export interface DiagramInfo {
  title: string
  createdAt?: string
  author?: string
}

import type { ContainerBounds, LinearConstraintBuilder, ItemBounds } from "../core"
import { getBoundsValues } from "../core"
import { ConstraintHelper } from "../hint"
import { SymbolBase, type SymbolBaseOptions, type ContainerSymbol } from "./symbol_base"
import { TextItem } from "../item"

const DEFAULT_TEXT_ITEM_HEIGHT = 20

export type DiagramSymbolCharacs = IContainerSymbolCharacs & {
  titleBounds: ItemBounds
  authorBounds?: ItemBounds
  createdAtBounds?: ItemBounds
}

export interface DiagramSymbolOptions extends Omit<SymbolBaseOptions, "id" | "bounds"> {
  info: DiagramInfo
  characs: DiagramSymbolCharacs
}

export class DiagramSymbol extends SymbolBase implements ContainerSymbol {
  readonly container: ContainerBounds

  private readonly diagramInfo: DiagramInfo
  private readonly titleItem: TextItem
  private readonly authorItem?: TextItem
  private readonly createdAtItem?: TextItem
  private constraintsApplied = false

  constructor(options: DiagramSymbolOptions) {
    super({ id: options.characs.id, bounds: options.characs.bounds, theme: options.theme })
    this.container = options.characs.container
    this.diagramInfo = options.info

    // Create TextItem for title
    const style = this.theme ? getStyleForSymbol(this.theme, "rectangle") : this.getFallbackStyle()
    this.titleItem = new TextItem({
      bounds: options.characs.titleBounds,
      text: options.info.title,
      alignment: "center",
      fontSize: style.fontSize * 1.5,
      fontFamily: style.fontFamily,
      textColor: style.textColor,
      padding: { top: 8, right: 12, bottom: 8, left: 12 },
    })

    // Create TextItem for author if provided
    if (options.info.author && options.characs.authorBounds) {
      this.authorItem = new TextItem({
        bounds: options.characs.authorBounds,
        text: `Author: ${options.info.author}`,
        alignment: "right",
        fontSize: style.fontSize * 0.75,
        fontFamily: style.fontFamily,
        textColor: style.textColor,
        padding: { top: 4, right: 10, bottom: 4, left: 10 },
      })
    }

    // Create TextItem for createdAt if provided
    if (options.info.createdAt && options.characs.createdAtBounds) {
      this.createdAtItem = new TextItem({
        bounds: options.characs.createdAtBounds,
        text: `Created: ${options.info.createdAt}`,
        alignment: "right",
        fontSize: style.fontSize * 0.75,
        fontFamily: style.fontFamily,
        textColor: style.textColor,
        padding: { top: 4, right: 10, bottom: 4, left: 10 },
      })
    }
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
    builder.ct([1, this.titleItem.bounds.x]).eq([1, bounds.x]).strong()
    builder.ct([1, this.titleItem.bounds.y]).eq([1, bounds.y], [padding.top, 1]).strong()
    builder.ct([1, this.titleItem.bounds.width]).eq([1, bounds.width]).strong()

    // Position author and createdAt at the bottom right if they exist
    let bottomOffset = -padding.bottom
    if (this.createdAtItem) {
      builder.ct([1, this.createdAtItem.bounds.x]).eq([1, bounds.x]).strong()
      builder
        .ct([1, this.createdAtItem.bounds.bottom])
        .eq([1, bounds.bottom], [bottomOffset, 1])
        .strong()
      builder.ct([1, this.createdAtItem.bounds.width]).eq([1, bounds.width]).strong()
      // Update offset for author if both exist
      if (this.authorItem) {
        bottomOffset -= this.createdAtItem.bounds.height.value() || DEFAULT_TEXT_ITEM_HEIGHT
      }
    }

    if (this.authorItem) {
      builder.ct([1, this.authorItem.bounds.x]).eq([1, bounds.x]).strong()
      builder
        .ct([1, this.authorItem.bounds.bottom])
        .eq([1, bounds.bottom], [bottomOffset, 1])
        .strong()
      builder.ct([1, this.authorItem.bounds.width]).eq([1, bounds.width]).strong()
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
    const { x, y, width, height } = getBoundsValues(this.bounds)

    const style = this.theme ? getStyleForSymbol(this.theme, "rectangle") : this.getFallbackStyle()

    return `
      <g id="${this.id}">
        <!-- Title -->
        ${this.titleItem.render()}
        ${this.authorItem ? `<!-- Author -->\n${this.authorItem.render()}` : ""}
        ${this.createdAtItem ? `<!-- Created At -->\n${this.createdAtItem.render()}` : ""}
      </g>
    `
  }
}
