import type { ContainerSymbolId, SymbolId } from "./types"
import { SymbolBase } from "./symbol_base"
import type { LayoutBounds } from "./symbol_base"
import type { LayoutContext } from "../layout/layout_context"
import type { Theme } from "../core/theme"
import { LayoutConstraintStrength } from "../layout/layout_variables"
import { expressionFromBounds } from "../layout/constraint_helpers"

export interface ContainerPadding {
  top: number
  right: number
  bottom: number
  left: number
}

interface ContainerContentProvider {
  getContentLayoutBounds(): LayoutBounds
}

export function isContainerContentProvider(symbol: SymbolBase): symbol is SymbolBase & ContainerContentProvider {
  return typeof (symbol as Partial<ContainerContentProvider>).getContentLayoutBounds === "function"
}

export abstract class ContainerSymbolBase<TId extends ContainerSymbolId = ContainerSymbolId> extends SymbolBase {
  override readonly id: TId
  protected readonly layout: LayoutContext
  private contentBounds?: LayoutBounds
  private containerConstraintsApplied = false
  protected readonly childIds = new Set<SymbolId | ContainerSymbolId>()

  protected constructor(id: TId, label: string, layout: LayoutContext) {
    super(id, label, layout.vars)
    this.id = id
    this.layout = layout
  }

  registerChild(id: SymbolId | ContainerSymbolId) {
    this.childIds.add(id)
  }

  clearChildren() {
    this.childIds.clear()
  }

  getContentLayoutBounds(): LayoutBounds {
    return this.ensureContentBounds()
  }

  protected ensureContentBounds(): LayoutBounds {
    if (!this.contentBounds) {
      const vars = this.layout.vars
      this.contentBounds = {
        x: vars.createVar(`${this.id}.content.x`),
        y: vars.createVar(`${this.id}.content.y`),
        width: vars.createVar(`${this.id}.content.width`),
        height: vars.createVar(`${this.id}.content.height`)
      }
    }
    if (!this.containerConstraintsApplied) {
      this.applyContainerConstraints()
      this.containerConstraintsApplied = true
    }
    return this.contentBounds
  }

  protected abstract getContainerPadding(theme: Theme): ContainerPadding

  protected getHeaderHeight(theme: Theme): number {
    return 0
  }

  private applyContainerConstraints() {
    const bounds = this.getLayoutBounds()
    const content = this.contentBounds!
    const theme = this.theme ?? this.layout.theme
    const padding = this.getContainerPadding(theme)
    const header = this.getHeaderHeight(theme)
    const horizontalPadding = padding.left + padding.right
    const verticalPadding = padding.top + padding.bottom + header

    this.layout.constraints.withSymbol(this, "containerInbounds", builder => {
      builder.eq(
        content.x,
        expressionFromBounds(this.layout, bounds, [{ axis: "x" }], padding.left),
        LayoutConstraintStrength.Strong
      )
      builder.eq(
        content.y,
        expressionFromBounds(this.layout, bounds, [{ axis: "y" }], padding.top + header),
        LayoutConstraintStrength.Strong
      )
      builder.eq(
        content.width,
        expressionFromBounds(this.layout, bounds, [{ axis: "width" }], -horizontalPadding),
        LayoutConstraintStrength.Strong
      )
      builder.eq(
        content.height,
        expressionFromBounds(this.layout, bounds, [{ axis: "height" }], -verticalPadding),
        LayoutConstraintStrength.Strong
      )
    })
  }
}
