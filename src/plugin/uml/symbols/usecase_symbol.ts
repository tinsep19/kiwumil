import type {
  LinearConstraintBuilder,
  Variable,
  ISymbolCharacs,
  ISymbol,
  SymbolId,
  LayoutBounds,
  ItemBounds,
} from "../../../core"
import { getStyleForSymbol, type Theme } from "../../../theme"
import type { Point } from "../../../core"
import { getBoundsValues } from "../../../core"
import { TextItem } from "../../../item"

const sqrt2 = Math.sqrt(2)

/**
 * IUsecaseSymbolCharacs: ユースケースシンボルの特性
 * ISymbolCharacs を拡張し、rx と ry プロパティを必須にする
 */
export type IUsecaseSymbolCharacs = ISymbolCharacs<{
  rx: Variable
  ry: Variable
  ellipse: ItemBounds
  label: ItemBounds
}>

export interface UsecaseSymbolOptions {
  label: string
  characs: IUsecaseSymbolCharacs
  theme: Theme
}

export class UsecaseSymbol implements ISymbol {
  readonly id: SymbolId
  readonly bounds: LayoutBounds
  protected readonly theme: Theme
  readonly label: string
  readonly rx: Variable
  readonly ry: Variable
  private readonly ellipseBounds: ItemBounds
  private readonly items: { label: TextItem }

  constructor(options: UsecaseSymbolOptions) {
    this.id = options.characs.id
    this.bounds = options.characs.bounds
    this.rx = options.characs.rx
    this.ry = options.characs.ry
    this.ellipseBounds = options.characs.ellipse
    this.theme = options.theme
    this.label = options.label

    // Get style from theme
    const style = this.theme ? getStyleForSymbol(this.theme, "usecase") : this.getFallbackStyle()

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

    this.items = { label: labelItem }
  }

  private getFallbackStyle() {
    return {
      strokeColor: "black",
      strokeWidth: 2,
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
    return { width: 120, height: 60 }
  }

  getConnectionPoint(from: Point): Point {
    const { x, y, width, height } = getBoundsValues(this.bounds)

    const cx = x + width / 2
    const cy = y + height / 2
    const rx = this.rx.value()
    const ry = this.ry.value()

    const dx = from.x - cx
    const dy = from.y - cy

    const angle = Math.atan2(dy, dx)

    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    }
  }

  toSVG(): string {
    const ellipseBoundsValues = getBoundsValues(this.ellipseBounds)

    // Calculate center and radii from ellipse bounds
    const cx = ellipseBoundsValues.centerX
    const cy = ellipseBoundsValues.centerY
    const rx = Math.max(2, ellipseBoundsValues.width / 2)
    const ry = Math.max(2, ellipseBoundsValues.height / 2)

    // テーマからスタイルを取得
    const style = this.theme ? getStyleForSymbol(this.theme, "usecase") : this.getFallbackStyle()

    return `
      <g id="${this.id}">
        <!-- Ellipse -->
        <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" 
                 fill="${style.fillColor}" stroke="${style.strokeColor}" stroke-width="${style.strokeWidth}"/>
        
        <!-- Label -->
        ${this.items.label.render()}
      </g>
    `
  }

  ensureLayoutBounds(builder: LinearConstraintBuilder): void {
    // Ensure ellipse bounds are within bounds
    builder.ct([1, this.bounds.left]).le([1, this.ellipseBounds.left]).required()
    builder.ct([1, this.ellipseBounds.left]).le([1, this.ellipseBounds.right]).required()
    builder.ct([1, this.ellipseBounds.right]).le([1, this.bounds.right]).required()
    builder.ct([1, this.bounds.top]).le([1, this.ellipseBounds.top]).required()
    builder.ct([1, this.ellipseBounds.top]).le([1, this.ellipseBounds.bottom]).required()
    builder.ct([1, this.ellipseBounds.bottom]).le([1, this.bounds.bottom]).required()

    // Weaken width and height constraints
    builder.ct([1, this.bounds.width]).eq([0, 1]).weak()
    builder.ct([1, this.bounds.height]).eq([0, 1]).weak()

    // Ellipse dimensions are determined by rx and ry
    builder.ct([1, this.ellipseBounds.width]).eq([2, this.rx]).required()
    builder.ct([1, this.ellipseBounds.height]).eq([2, this.ry]).required()

    // Label is centered within ellipse bounds
    const labelBounds = this.items.label.bounds
    builder.ct([1, labelBounds.centerX]).eq([1, this.ellipseBounds.centerX]).strong()
    builder.ct([1, labelBounds.centerY]).eq([1, this.ellipseBounds.centerY]).strong()

    // Get label default size
    const labelDefaultSize = this.items.label.getDefaultSize()

    // Label default size (weak constraint)
    builder.ct([1, labelBounds.width]).eq([labelDefaultSize.width, 1]).weak()
    builder.ct([1, labelBounds.height]).eq([labelDefaultSize.height, 1]).weak()

    // Label minimum size (medium constraint)
    builder.ct([1, labelBounds.width]).ge([labelDefaultSize.width, 1]).medium()
    builder.ct([1, labelBounds.height]).ge([labelDefaultSize.height, 1]).medium()

    // Ensure ellipse is large enough to contain the label (medium constraint)
    // Since label is centered, rx must be at least labelWidth/sqrt2 and ry must be at least labelHeight/sqrt2
    builder.ct([sqrt2, this.rx]).ge([1, labelBounds.width]).medium()
    builder.ct([sqrt2, this.ry]).ge([1, labelBounds.height]).medium()
  }

  render(): string {
    return this.toSVG()
  }
}
