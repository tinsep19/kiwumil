import type { ContainerSymbolId, SymbolId } from "./types"
import { SymbolBase } from "./symbol_base"
import { LayoutBound } from "../layout/layout_bound"
import type { LayoutContext } from "../layout/layout_context"
import type { Theme } from "../theme"
import { LayoutConstraintStrength } from "../layout/layout_variables"

export interface ContainerPadding {
  top: number
  right: number
  bottom: number
  left: number
}

export function toContainerSymbolId(id: SymbolId): ContainerSymbolId {
  return id as ContainerSymbolId
}

interface ContainerContentProvider {
  getContentLayoutBounds(): LayoutBound
}

export function isContainerContentProvider(symbol: SymbolBase): symbol is SymbolBase & ContainerContentProvider {
  return typeof (symbol as Partial<ContainerContentProvider>).getContentLayoutBounds === "function"
}

export abstract class ContainerSymbolBase<TId extends ContainerSymbolId = ContainerSymbolId> extends SymbolBase {
  override readonly id: TId
  protected readonly layout: LayoutContext
  private contentBounds?: LayoutBound
  private containerConstraintsApplied = false
  protected readonly childIds = new Set<SymbolId | ContainerSymbolId>()

  protected constructor(id: TId, label: string, layout: LayoutContext) {
    super(id, label, layout.variables)
    this.id = id
    this.layout = layout
  }

  registerChild(id: SymbolId | ContainerSymbolId) {
    this.childIds.add(id)
  }

  clearChildren() {
    this.childIds.clear()
  }

  getContentLayoutBounds(): LayoutBound {
    return this.ensureContentBounds()
  }

  protected ensureContentBounds(): LayoutBound {
    if (!this.contentBounds) {
      const vars = this.layout.variables
      this.contentBounds = vars.createBound(`${this.id}.content`)
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
        this.layout.expressionFromBounds(bounds, [{ axis: "x" }], padding.left),
        LayoutConstraintStrength.Strong
      )
      builder.eq(
        content.y,
        this.layout.expressionFromBounds(bounds, [{ axis: "y" }], padding.top + header),
        LayoutConstraintStrength.Strong
      )
      builder.eq(
        content.width,
        this.layout.expressionFromBounds(bounds, [{ axis: "width" }], -horizontalPadding),
        LayoutConstraintStrength.Strong
      )
      builder.eq(
        content.height,
        this.layout.expressionFromBounds(bounds, [{ axis: "height" }], -verticalPadding),
        LayoutConstraintStrength.Strong
      )
    })
  }
}
