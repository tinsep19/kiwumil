// src/plugin/uml/symbols/actor_symbol.ts
import type {
  LinearConstraintBuilder,
  ItemBounds,
  ISymbolCharacs,
  ISymbol,
  SymbolId,
  LayoutBounds,
} from "../../../core"
import { getStyleForSymbol, type Theme } from "../../../theme"
import type { Point } from "../../../core"
import { getBoundsValues } from "../../../core"
import type { IconMeta } from "../../../icon"
import { IconItem, TextItem } from "../../../item"

export type ActorSymbolCharacs = ISymbolCharacs<{
  icon: ItemBounds
  label: ItemBounds
  stereotype: ItemBounds
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
  private readonly items: { icon: IconItem; label: TextItem; stereotype: TextItem }

  constructor(options: ActorSymbolOptions) {
    this.id = options.characs.id
    this.bounds = options.characs.bounds
    this.theme = options.theme
    this.label = options.label
    this.stereotype = options.stereotype

    // Get style from theme
    const style = this.theme ? getStyleForSymbol(this.theme, "actor") : this.getFallbackStyle()

    // Create IconItem for actor figure
    const iconItem = new IconItem({
      bounds: options.characs.icon,
      icon: options.icon,
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

    // Create TextItem for stereotype (always created, even if no text)
    const stereotypeItem = new TextItem({
      bounds: options.characs.stereotype,
      text: options.stereotype ? `<<${options.stereotype}>>` : "",
      alignment: "center",
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      textColor: style.textColor,
      padding: { top: 2, right: 8, bottom: 2, left: 8 },
    })

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
        ${this.stereotype ? `<!-- Stereotype -->\n${this.items.stereotype.render()}` : ""}
        <!-- Actor Icon -->
        ${this.items.icon.render()}
        <!-- Label -->
        ${this.items.label.render()}
      </g>
    `
  }

  ensureLayoutBounds(builder: LinearConstraintBuilder): void {
    const bounds = this.bounds
    const iconBounds = this.items.icon.bounds
    const stereotypeBounds = this.items.stereotype.bounds
    const labelBounds = this.items.label.bounds

    // Get default sizes from items
    const iconSize = this.items.icon.getDefaultSize()
    const stereotypeDefaultSize = this.stereotype
      ? this.items.stereotype.getDefaultSize()
      : { width: 0, height: 0 }
    const labelDefaultSize = this.items.label.getDefaultSize()

    // 1. Icon's center aligns with bounds.centerX and bounds.centerY (strong)
    builder.ct([1, iconBounds.centerX]).eq([1, bounds.centerX]).strong()
    builder.ct([1, iconBounds.centerY]).eq([1, bounds.centerY]).strong()

    // 2. Icon's size must match the size from IconMeta (strong)
    builder.ct([1, iconBounds.width]).eq([iconSize.width, 1]).strong()
    builder.ct([1, iconBounds.height]).eq([iconSize.height, 1]).strong()

    // 3. Stereotype's bottom center aligns with icon's top center (strong)
    builder.ct([1, stereotypeBounds.centerX]).eq([1, iconBounds.centerX]).strong()
    builder.ct([1, stereotypeBounds.bottom]).eq([1, iconBounds.top]).strong()

    // 4. Label's top center aligns with icon's bottom center (strong)
    builder.ct([1, labelBounds.centerX]).eq([1, iconBounds.centerX]).strong()
    builder.ct([1, labelBounds.top]).eq([1, iconBounds.bottom]).strong()

    // 5. Stereotype and label default sizes (weak constraint)
    // If no text is specified, size defaults to (0, 0), otherwise default to TextItem's default size
    builder.ct([1, stereotypeBounds.width]).eq([stereotypeDefaultSize.width, 1]).weak()
    builder.ct([1, stereotypeBounds.height]).eq([stereotypeDefaultSize.height, 1]).weak()
    builder.ct([1, labelBounds.width]).eq([labelDefaultSize.width, 1]).weak()
    builder.ct([1, labelBounds.height]).eq([labelDefaultSize.height, 1]).weak()

    // 6. Stereotype and label minimum sizes (medium constraint)
    builder.ct([1, stereotypeBounds.width]).ge([stereotypeDefaultSize.width, 1]).medium()
    builder.ct([1, stereotypeBounds.height]).ge([stereotypeDefaultSize.height, 1]).medium()
    builder.ct([1, labelBounds.width]).ge([labelDefaultSize.width, 1]).medium()
    builder.ct([1, labelBounds.height]).ge([labelDefaultSize.height, 1]).medium()

    // 7. Ensure bounds is large enough to contain all centered items (medium)
    // Since icon, stereotype, and label are all centered at bounds.centerX,
    // bounds.width must be at least as wide as the widest item
    builder.ct([1, bounds.width]).ge([iconSize.width, 1]).medium()
    builder.ct([1, bounds.width]).ge([stereotypeDefaultSize.width, 1]).medium()
    builder.ct([1, bounds.width]).ge([labelDefaultSize.width, 1]).medium()

    // Similarly for height - bounds must contain the entire vertical stack
    // Total height is stereotype + icon + label
    builder
      .ct([1, bounds.height])
      .ge([stereotypeDefaultSize.height, 1], [iconSize.height, 1], [labelDefaultSize.height, 1])
      .medium()

    // 8. Bounds auto-expansion with weak constraint
    // Weak constraint to suggest minimal size, but allows growth based on content
    builder.ct([1, bounds.width]).ge([1, 1]).weak()
    builder.ct([1, bounds.height]).ge([1, 1]).weak()
  }

  render(): string {
    return this.toSVG()
  }
}
