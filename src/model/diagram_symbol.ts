// src/model/diagram_symbol.ts
import { getStyleForSymbol } from "../theme"
import type { Theme, ContainerPadding } from "../theme"
import type { Point } from "../core"
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

export interface DiagramSymbolOptions extends SymbolBaseOptions {
  info: DiagramInfo
  container: ContainerBounds
  titleBounds: ItemBounds
  metadataBounds?: ItemBounds
}

export class DiagramSymbol extends SymbolBase implements ContainerSymbol {
  readonly container: ContainerBounds

  private readonly diagramInfo: DiagramInfo
  private readonly titleItem: TextItem
  private readonly metadataItem?: TextItem
  private constraintsApplied = false

  constructor(options: DiagramSymbolOptions) {
    super(options)
    this.container = options.container
    this.diagramInfo = options.info

    // Create TextItem for title
    const style = this.theme ? getStyleForSymbol(this.theme, "rectangle") : this.getFallbackStyle()
    this.titleItem = new TextItem({
      bounds: options.titleBounds,
      text: options.info.title,
      alignment: "center",
      fontSize: style.fontSize * 1.5,
      fontFamily: style.fontFamily,
      textColor: style.textColor,
      padding: { top: 8, right: 12, bottom: 8, left: 12 },
    })

    // Create TextItem for metadata if provided
    if (options.metadataBounds && (options.info.createdAt || options.info.author)) {
      let metaText = ""
      if (options.info.createdAt && options.info.author) {
        metaText = `Created: ${options.info.createdAt} | Author: ${options.info.author}`
      } else if (options.info.createdAt) {
        metaText = `Created: ${options.info.createdAt}`
      } else if (options.info.author) {
        metaText = `Author: ${options.info.author}`
      }

      this.metadataItem = new TextItem({
        bounds: options.metadataBounds,
        text: metaText,
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

    // Position metadata at the bottom right if it exists
    if (this.metadataItem) {
      builder.ct([1, this.metadataItem.bounds.x]).eq([1, bounds.x]).strong()
      builder
        .ct([1, this.metadataItem.bounds.bottom])
        .eq([1, bounds.bottom], [-padding.bottom, 1])
        .strong()
      builder.ct([1, this.metadataItem.bounds.width]).eq([1, bounds.width]).strong()
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
        ${this.metadataItem ? `<!-- Metadata -->\n${this.metadataItem.render()}` : ""}
      </g>
    `
  }
}
