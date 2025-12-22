// src/plugin/uml/symbols/actor_symbol.ts
import type { LinearConstraintBuilder, ItemBounds } from "../../../core"
import { SymbolBase, type SymbolBaseOptions } from "../../../model/symbol_base"
import { getStyleForSymbol } from "../../../theme"
import type { Point } from "../../../core"
import { getBoundsValues } from "../../../core"
import type { IconMeta } from "../../../icon"
import { IconItem, TextItem } from "../../../item"

// Icon size constant
const ICON_BASE_SIZE = 60

export interface ActorSymbolOptions extends SymbolBaseOptions {
  label: string
  stereotype?: string
  icon: IconMeta
  iconBounds: ItemBounds
  labelBounds: ItemBounds
  stereotypeBounds?: ItemBounds
}

export class ActorSymbol extends SymbolBase {
  readonly label: string
  readonly stereotype?: string
  private readonly iconItem: IconItem
  private readonly labelItem: TextItem
  private readonly stereotypeItem?: TextItem

  constructor(options: ActorSymbolOptions) {
    super(options)
    this.label = options.label
    this.stereotype = options.stereotype

    // Get style from theme
    const style = this.theme
      ? getStyleForSymbol(this.theme, "actor")
      : this.getFallbackStyle()

    // Create IconItem for actor figure
    this.iconItem = new IconItem({
      bounds: options.iconBounds,
      icon: options.icon,
      width: ICON_BASE_SIZE,
      height: ICON_BASE_SIZE,
      color: style.strokeColor,
    })

    // Create TextItem for label
    this.labelItem = new TextItem({
      bounds: options.labelBounds,
      text: options.label,
      alignment: "center",
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      textColor: style.textColor,
      padding: { top: 4, right: 8, bottom: 4, left: 8 },
    })

    // Create TextItem for stereotype if provided
    if (options.stereotype && options.stereotypeBounds) {
      this.stereotypeItem = new TextItem({
        bounds: options.stereotypeBounds,
        text: `<<${options.stereotype}>>`,
        alignment: "center",
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        textColor: style.textColor,
        padding: { top: 2, right: 8, bottom: 2, left: 8 },
      })
    }
  }

  private getFallbackStyle() {
    return {
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
  }

  getDefaultSize() {
    return { width: 60, height: 80 }
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
        ${this.stereotypeItem ? `<!-- Stereotype -->\n${this.stereotypeItem.render()}` : ""}
        <!-- Actor Icon -->
        ${this.iconItem.render()}
        <!-- Label -->
        ${this.labelItem.render()}
      </g>
    `
  }

  ensureLayoutBounds(builder: LinearConstraintBuilder): void {
    const bounds = this.bounds
    const style = this.theme ? getStyleForSymbol(this.theme, "actor") : this.getFallbackStyle()

    // Layout constraints for icon, label, and optional stereotype
    const stereotypeHeight = this.stereotypeItem ? style.fontSize + 5 : 0

    // Position stereotype at top if present
    if (this.stereotypeItem) {
      builder.ct([1, this.stereotypeItem.bounds.x]).eq([1, bounds.x]).strong()
      builder.ct([1, this.stereotypeItem.bounds.y]).eq([1, bounds.y]).strong()
      builder.ct([1, this.stereotypeItem.bounds.width]).eq([1, bounds.width]).strong()
    }

    // Position icon below stereotype (or at top if no stereotype)
    builder.ct([1, this.iconItem.bounds.x]).eq([1, bounds.x], [0.5, bounds.width], [-ICON_BASE_SIZE / 2, 1]).strong()
    builder.ct([1, this.iconItem.bounds.y]).eq([1, bounds.y], [stereotypeHeight + 5, 1]).strong()
    builder.ct([1, this.iconItem.bounds.width]).eq([ICON_BASE_SIZE, 1]).strong()
    builder.ct([1, this.iconItem.bounds.height]).eq([ICON_BASE_SIZE, 1]).strong()

    // Position label at bottom
    builder.ct([1, this.labelItem.bounds.x]).eq([1, bounds.x]).strong()
    builder.ct([1, this.labelItem.bounds.bottom]).eq([1, bounds.bottom]).strong()
    builder.ct([1, this.labelItem.bounds.width]).eq([1, bounds.width]).strong()
  }
}
