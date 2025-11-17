// src/layout/layout_solver.ts
import type { SymbolBase, LayoutBounds } from "../model/symbol_base"
import type { LayoutHint } from "../dsl/hint_factory"
import type { Theme } from "../core/theme"
import {
  LayoutConstraintOperator,
  LayoutConstraintStrength
} from "./layout_variable_context"
import type { LayoutVariableContext } from "./layout_variable_context"

export class LayoutSolver {
  private readonly theme: Theme
  private readonly layoutContext: LayoutVariableContext
  private readonly boundsMap: Map<string, LayoutBounds>

  constructor(theme: Theme, layoutContext: LayoutVariableContext) {
    this.theme = theme
    this.layoutContext = layoutContext
    this.boundsMap = new Map()
  }

  solve(symbols: SymbolBase[], hints: LayoutHint[]) {
    this.boundsMap.clear()

    for (const symbol of symbols) {
      const size = symbol.getDefaultSize()
      const layoutBounds = symbol.ensureLayoutBounds(this.layoutContext)
      this.boundsMap.set(symbol.id, layoutBounds)

      const isContainer = hints.some(h => h.type === "enclose" && h.containerId === symbol.id)

      if (!isContainer) {
        this.layoutContext.addConstraint(
          layoutBounds.width,
          LayoutConstraintOperator.Eq,
          size.width
        )
        this.layoutContext.addConstraint(
          layoutBounds.height,
          LayoutConstraintOperator.Eq,
          size.height
        )
      } else {
        this.layoutContext.addConstraint(
          layoutBounds.width,
          LayoutConstraintOperator.Ge,
          100,
          LayoutConstraintStrength.Weak
        )
        this.layoutContext.addConstraint(
          layoutBounds.height,
          LayoutConstraintOperator.Ge,
          100,
          LayoutConstraintStrength.Weak
        )
      }
    }

    for (const hint of hints) {
      if (hint.type === "horizontal" || hint.type === "arrangeHorizontal") {
        this.addHorizontalConstraints(hint.symbolIds, hint.gap || this.theme.defaultStyleSet.horizontalGap)
      } else if (hint.type === "vertical" || hint.type === "arrangeVertical") {
        this.addVerticalConstraints(hint.symbolIds, hint.gap || this.theme.defaultStyleSet.verticalGap)
      } else if (hint.type === "enclose") {
        this.addEncloseConstraints(hint.containerId!, hint.childIds!)
      } else if (hint.type === "alignLeft") {
        this.addAlignLeftConstraints(hint.symbolIds)
      } else if (hint.type === "alignRight") {
        this.addAlignRightConstraints(hint.symbolIds)
      } else if (hint.type === "alignTop") {
        this.addAlignTopConstraints(hint.symbolIds)
      } else if (hint.type === "alignBottom") {
        this.addAlignBottomConstraints(hint.symbolIds)
      } else if (hint.type === "alignCenterX") {
        this.addAlignCenterXConstraints(hint.symbolIds)
      } else if (hint.type === "alignCenterY") {
        this.addAlignCenterYConstraints(hint.symbolIds)
      } else if (hint.type === "alignWidth") {
        this.addAlignWidthConstraints(hint.symbolIds)
      } else if (hint.type === "alignHeight") {
        this.addAlignHeightConstraints(hint.symbolIds)
      } else if (hint.type === "alignSize") {
        this.addAlignSizeConstraints(hint.symbolIds)
      }
    }

    this.layoutContext.solve()

    for (const symbol of symbols) {
      const bounds = this.boundsMap.get(symbol.id)
      if (!bounds) continue
      symbol.bounds = {
        x: this.layoutContext.valueOf(bounds.x),
        y: this.layoutContext.valueOf(bounds.y),
        width: this.layoutContext.valueOf(bounds.width),
        height: this.layoutContext.valueOf(bounds.height)
      }
    }
  }

  private addHorizontalConstraints(symbolIds: string[], gap: number) {
    for (let i = 0; i < symbolIds.length - 1; i++) {
      const aId = symbolIds[i]
      const bId = symbolIds[i + 1]
      if (!aId || !bId) continue
      const a = this.boundsMap.get(aId)
      const b = this.boundsMap.get(bId)
      if (!a || !b) continue

      this.layoutContext.addConstraint(
        b.x,
        LayoutConstraintOperator.Eq,
        this.layoutContext.expression(
          [
            { variable: a.x },
            { variable: a.width }
          ],
          gap
        ),
        LayoutConstraintStrength.Strong
      )
    }
  }

  private addVerticalConstraints(symbolIds: string[], gap: number) {
    for (let i = 0; i < symbolIds.length - 1; i++) {
      const aId = symbolIds[i]
      const bId = symbolIds[i + 1]
      if (!aId || !bId) continue
      const a = this.boundsMap.get(aId)
      const b = this.boundsMap.get(bId)
      if (!a || !b) continue

      this.layoutContext.addConstraint(
        b.y,
        LayoutConstraintOperator.Eq,
        this.layoutContext.expression(
          [
            { variable: a.y },
            { variable: a.height }
          ],
          gap
        ),
        LayoutConstraintStrength.Strong
      )
    }
  }

  private addEncloseConstraints(containerId: string, childIds: string[] = []) {
    const container = this.boundsMap.get(containerId)
    if (!container) return
    const padding = 20

    for (const childId of childIds) {
      const child = this.boundsMap.get(childId)
      if (!child) continue

      this.layoutContext.addConstraint(
        child.x,
        LayoutConstraintOperator.Ge,
        this.layoutContext.expression([{ variable: container.x }], padding),
        LayoutConstraintStrength.Required
      )

      this.layoutContext.addConstraint(
        child.y,
        LayoutConstraintOperator.Ge,
        this.layoutContext.expression([{ variable: container.y }], 50),
        LayoutConstraintStrength.Required
      )

      this.layoutContext.addConstraint(
        this.layoutContext.expression([
          { variable: container.width },
          { variable: container.x }
        ]),
        LayoutConstraintOperator.Ge,
        this.layoutContext.expression(
          [
            { variable: child.x },
            { variable: child.width }
          ],
          padding
        ),
        LayoutConstraintStrength.Required
      )

      this.layoutContext.addConstraint(
        this.layoutContext.expression([
          { variable: container.height },
          { variable: container.y }
        ]),
        LayoutConstraintOperator.Ge,
        this.layoutContext.expression(
          [
            { variable: child.y },
            { variable: child.height }
          ],
          padding
        ),
        LayoutConstraintStrength.Required
      )
    }
  }

  private addAlignLeftConstraints(symbolIds: string[]) {
    if (symbolIds.length < 2) return
    const firstId = symbolIds[0]
    if (!firstId) return
    const first = this.boundsMap.get(firstId)
    if (!first) return

    for (let i = 1; i < symbolIds.length; i++) {
      const symbolId = symbolIds[i]
      if (!symbolId) continue
      const symbol = this.boundsMap.get(symbolId)
      if (!symbol) continue
      this.layoutContext.addConstraint(
        symbol.x,
        LayoutConstraintOperator.Eq,
        first.x,
        LayoutConstraintStrength.Strong
      )
    }
  }

  private addAlignRightConstraints(symbolIds: string[]) {
    if (symbolIds.length < 2) return
    const firstId = symbolIds[0]
    if (!firstId) return
    const first = this.boundsMap.get(firstId)
    if (!first) return

    for (let i = 1; i < symbolIds.length; i++) {
      const symbolId = symbolIds[i]
      if (!symbolId) continue
      const symbol = this.boundsMap.get(symbolId)
      if (!symbol) continue
      this.layoutContext.addConstraint(
        this.layoutContext.expression([
          { variable: symbol.x },
          { variable: symbol.width }
        ]),
        LayoutConstraintOperator.Eq,
        this.layoutContext.expression([
          { variable: first.x },
          { variable: first.width }
        ]),
        LayoutConstraintStrength.Strong
      )
    }
  }

  private addAlignTopConstraints(symbolIds: string[]) {
    if (symbolIds.length < 2) return
    const firstId = symbolIds[0]
    if (!firstId) return
    const first = this.boundsMap.get(firstId)
    if (!first) return

    for (let i = 1; i < symbolIds.length; i++) {
      const symbolId = symbolIds[i]
      if (!symbolId) continue
      const symbol = this.boundsMap.get(symbolId)
      if (!symbol) continue
      this.layoutContext.addConstraint(
        symbol.y,
        LayoutConstraintOperator.Eq,
        first.y,
        LayoutConstraintStrength.Strong
      )
    }
  }

  private addAlignBottomConstraints(symbolIds: string[]) {
    if (symbolIds.length < 2) return
    const firstId = symbolIds[0]
    if (!firstId) return
    const first = this.boundsMap.get(firstId)
    if (!first) return

    for (let i = 1; i < symbolIds.length; i++) {
      const symbolId = symbolIds[i]
      if (!symbolId) continue
      const symbol = this.boundsMap.get(symbolId)
      if (!symbol) continue
      this.layoutContext.addConstraint(
        this.layoutContext.expression([
          { variable: symbol.y },
          { variable: symbol.height }
        ]),
        LayoutConstraintOperator.Eq,
        this.layoutContext.expression([
          { variable: first.y },
          { variable: first.height }
        ]),
        LayoutConstraintStrength.Strong
      )
    }
  }

  private addAlignCenterXConstraints(symbolIds: string[]) {
    if (symbolIds.length < 2) return
    const firstId = symbolIds[0]
    if (!firstId) return
    const first = this.boundsMap.get(firstId)
    if (!first) return

    for (let i = 1; i < symbolIds.length; i++) {
      const symbolId = symbolIds[i]
      if (!symbolId) continue
      const symbol = this.boundsMap.get(symbolId)
      if (!symbol) continue
      this.layoutContext.addConstraint(
        this.layoutContext.expression([
          { variable: symbol.x },
          { variable: symbol.width, coefficient: 0.5 }
        ]),
        LayoutConstraintOperator.Eq,
        this.layoutContext.expression([
          { variable: first.x },
          { variable: first.width, coefficient: 0.5 }
        ]),
        LayoutConstraintStrength.Strong
      )
    }
  }

  private addAlignCenterYConstraints(symbolIds: string[]) {
    if (symbolIds.length < 2) return
    const firstId = symbolIds[0]
    if (!firstId) return
    const first = this.boundsMap.get(firstId)
    if (!first) return

    for (let i = 1; i < symbolIds.length; i++) {
      const symbolId = symbolIds[i]
      if (!symbolId) continue
      const symbol = this.boundsMap.get(symbolId)
      if (!symbol) continue
      this.layoutContext.addConstraint(
        this.layoutContext.expression([
          { variable: symbol.y },
          { variable: symbol.height, coefficient: 0.5 }
        ]),
        LayoutConstraintOperator.Eq,
        this.layoutContext.expression([
          { variable: first.y },
          { variable: first.height, coefficient: 0.5 }
        ]),
        LayoutConstraintStrength.Strong
      )
    }
  }

  private addAlignWidthConstraints(symbolIds: string[]) {
    if (symbolIds.length < 2) return
    const firstId = symbolIds[0]
    if (!firstId) return
    const first = this.boundsMap.get(firstId)
    if (!first) return

    for (let i = 1; i < symbolIds.length; i++) {
      const symbolId = symbolIds[i]
      if (!symbolId) continue
      const symbol = this.boundsMap.get(symbolId)
      if (!symbol) continue
      this.layoutContext.addConstraint(
        symbol.width,
        LayoutConstraintOperator.Eq,
        first.width,
        LayoutConstraintStrength.Strong
      )
    }
  }

  private addAlignHeightConstraints(symbolIds: string[]) {
    if (symbolIds.length < 2) return
    const firstId = symbolIds[0]
    if (!firstId) return
    const first = this.boundsMap.get(firstId)
    if (!first) return

    for (let i = 1; i < symbolIds.length; i++) {
      const symbolId = symbolIds[i]
      if (!symbolId) continue
      const symbol = this.boundsMap.get(symbolId)
      if (!symbol) continue
      this.layoutContext.addConstraint(
        symbol.height,
        LayoutConstraintOperator.Eq,
        first.height,
        LayoutConstraintStrength.Strong
      )
    }
  }

  private addAlignSizeConstraints(symbolIds: string[]) {
    if (symbolIds.length < 2) return
    const firstId = symbolIds[0]
    if (!firstId) return
    const first = this.boundsMap.get(firstId)
    if (!first) return

    for (let i = 1; i < symbolIds.length; i++) {
      const symbolId = symbolIds[i]
      if (!symbolId) continue
      const symbol = this.boundsMap.get(symbolId)
      if (!symbol) continue
      this.layoutContext.addConstraint(
        symbol.width,
        LayoutConstraintOperator.Eq,
        first.width,
        LayoutConstraintStrength.Strong
      )
      this.layoutContext.addConstraint(
        symbol.height,
        LayoutConstraintOperator.Eq,
        first.height,
        LayoutConstraintStrength.Strong
      )
    }
  }
}
