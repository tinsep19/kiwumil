// src/plugin/uml/symbols/actor_symbol.ts
import type { LinearConstraintBuilder, ItemBounds, ISymbolCharacs, ISymbol, SymbolId, LayoutBounds } from "../../../core"
import { getStyleForSymbol, type Theme } from "../../../theme"
import type { Point } from "../../../core"
import { getBoundsValues } from "../../../core"
import type { IconMeta } from "../../../icon"
import { IconItem, TextItem } from "../../../item"

// Icon size constant
const ICON_BASE_SIZE = 60

export type ActorSymbolCharacs = ISymbolCharacs<{
  icon: ItemBounds
  label: ItemBounds
  stereotype?: ItemBounds
}>

export interface ActorSymbolOptions {
  label: string
  stereotype?: string
  icon: IconMeta
  characs: ActorSymbolCharacs
  theme: Theme
}

export class ActorSymbol implements ISymbol {
  readonly id: SymbolId
  readonly bounds: LayoutBounds
  protected readonly theme: Theme
  readonly label: string
  readonly stereotype?: string
  private readonly items: { icon: IconItem; label: TextItem; stereotype?: TextItem }

  constructor(options: ActorSymbolOptions) {
    this.id = options.characs.id
    this.bounds = options.characs.bounds
    this.theme = options.theme
    this.label = options.label
    this.stereotype = options.stereotype

    // Get style from theme
    const style = this.theme
      ? getStyleForSymbol(this.theme, "actor")
      : this.getFallbackStyle()

    // Create IconItem for actor figure
    const iconItem = new IconItem({
      bounds: options.characs.icon,
      icon: options.icon,
      width: ICON_BASE_SIZE,
      height: ICON_BASE_SIZE,
      color: style.strokeColor,
    })

    // Create TextItem for label
    const labelItem = new TextItem({
      bounds: options.characs.label,
      text: options.label,
      alignment: "center",
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      textColor: style.textColor,
      padding: { top: 4, right: 8, bottom: 4, left: 8 },
    })

    // Create TextItem for stereotype if provided
    const stereotypeItem = options.stereotype && options.characs.stereotype
      ? new TextItem({
          bounds: options.characs.stereotype,
          text: `<<${options.stereotype}>>`,
          alignment: "center",
          fontSize: style.fontSize,
          fontFamily: style.fontFamily,
          textColor: style.textColor,
          padding: { top: 2, right: 8, bottom: 2, left: 8 },
        })
      : undefined

    this.items = { icon: iconItem, label: labelItem, stereotype: stereotypeItem }
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
        ${this.items.stereotype ? `<!-- Stereotype -->\n${this.items.stereotype.render()}` : ""}
        <!-- Actor Icon -->
        ${this.items.icon.render()}
        <!-- Label -->
        ${this.items.label.render()}
      </g>
    `
  }

  ensureLayoutBounds(builder: LinearConstraintBuilder): void {
    const bounds = this.bounds
    const style = this.theme ? getStyleForSymbol(this.theme, "actor") : this.getFallbackStyle()

    // Layout constraints for icon, label, and optional stereotype
    const stereotypeHeight = this.items.stereotype ? style.fontSize + 5 : 0

    // Position stereotype at top if present
    if (this.items.stereotype) {
      builder.ct([1, this.items.stereotype.bounds.x]).eq([1, bounds.x]).strong()
      builder.ct([1, this.items.stereotype.bounds.y]).eq([1, bounds.y]).strong()
      builder.ct([1, this.items.stereotype.bounds.width]).eq([1, bounds.width]).strong()
    }

    // Position icon below stereotype (or at top if no stereotype)
    builder.ct([1, this.items.icon.bounds.x]).eq([1, bounds.x], [0.5, bounds.width], [-ICON_BASE_SIZE / 2, 1]).strong()
    builder.ct([1, this.items.icon.bounds.y]).eq([1, bounds.y], [stereotypeHeight + 5, 1]).strong()
    builder.ct([1, this.items.icon.bounds.width]).eq([ICON_BASE_SIZE, 1]).strong()
    builder.ct([1, this.items.icon.bounds.height]).eq([ICON_BASE_SIZE, 1]).strong()

    // Position label at bottom
    builder.ct([1, this.items.label.bounds.x]).eq([1, bounds.x]).strong()
    builder.ct([1, this.items.label.bounds.bottom]).eq([1, bounds.bottom]).strong()
    builder.ct([1, this.items.label.bounds.width]).eq([1, bounds.width]).strong()
  }

  render(): string {
    return this.toSVG()
  }
}
