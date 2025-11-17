// src/layout/layout_solver.ts
import * as kiwi from "@lume/kiwi"
import type { SymbolBase, LayoutBounds } from "../model/symbol_base"
import type { LayoutHint } from "../dsl/hint_factory"
import type { Theme } from "../core/theme"
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
        this.layoutContext.addConstraint(layoutBounds.width, kiwi.Operator.Eq, size.width)
        this.layoutContext.addConstraint(layoutBounds.height, kiwi.Operator.Eq, size.height)
      } else {
        this.layoutContext.addConstraint(
          layoutBounds.width,
          kiwi.Operator.Ge,
          100,
          kiwi.Strength.weak
        )
        this.layoutContext.addConstraint(
          layoutBounds.height,
          kiwi.Operator.Ge,
          100,
          kiwi.Strength.weak
        )
      }
    }

    if (symbols.length > 0) {
      const firstSymbol = symbols[0]
      const first = firstSymbol ? this.boundsMap.get(firstSymbol.id) : undefined
      if (first) {
        this.layoutContext.addConstraint(first.x, kiwi.Operator.Eq, 50)
        this.layoutContext.addConstraint(first.y, kiwi.Operator.Eq, 50)
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
        kiwi.Operator.Eq,
        this.layoutContext.expression(
          [
            { variable: a.x },
            { variable: a.width }
          ],
          gap
        ),
        kiwi.Strength.strong
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
        kiwi.Operator.Eq,
        this.layoutContext.expression(
          [
            { variable: a.y },
            { variable: a.height }
          ],
          gap
        ),
        kiwi.Strength.strong
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
        kiwi.Operator.Ge,
        this.layoutContext.expression([{ variable: container.x }], padding),
        kiwi.Strength.required
      )

      this.layoutContext.addConstraint(
        child.y,
        kiwi.Operator.Ge,
        this.layoutContext.expression([{ variable: container.y }], 50),
        kiwi.Strength.required
      )

      this.layoutContext.addConstraint(
        this.layoutContext.expression([
          { variable: container.width },
          { variable: container.x }
        ]),
        kiwi.Operator.Ge,
        this.layoutContext.expression(
          [
            { variable: child.x },
            { variable: child.width }
          ],
          padding
        ),
        kiwi.Strength.required
      )

      this.layoutContext.addConstraint(
        this.layoutContext.expression([
          { variable: container.height },
          { variable: container.y }
        ]),
        kiwi.Operator.Ge,
        this.layoutContext.expression(
          [
            { variable: child.y },
            { variable: child.height }
          ],
          padding
        ),
        kiwi.Strength.required
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
      this.layoutContext.addConstraint(symbol.x, kiwi.Operator.Eq, first.x, kiwi.Strength.strong)
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
        kiwi.Operator.Eq,
        this.layoutContext.expression([
          { variable: first.x },
          { variable: first.width }
        ]),
        kiwi.Strength.strong
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
      this.layoutContext.addConstraint(symbol.y, kiwi.Operator.Eq, first.y, kiwi.Strength.strong)
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
        kiwi.Operator.Eq,
        this.layoutContext.expression([
          { variable: first.y },
          { variable: first.height }
        ]),
        kiwi.Strength.strong
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
        kiwi.Operator.Eq,
        this.layoutContext.expression([
          { variable: first.x },
          { variable: first.width, coefficient: 0.5 }
        ]),
        kiwi.Strength.strong
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
        kiwi.Operator.Eq,
        this.layoutContext.expression([
          { variable: first.y },
          { variable: first.height, coefficient: 0.5 }
        ]),
        kiwi.Strength.strong
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
      this.layoutContext.addConstraint(symbol.width, kiwi.Operator.Eq, first.width, kiwi.Strength.strong)
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
      this.layoutContext.addConstraint(symbol.height, kiwi.Operator.Eq, first.height, kiwi.Strength.strong)
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
      this.layoutContext.addConstraint(symbol.width, kiwi.Operator.Eq, first.width, kiwi.Strength.strong)
      this.layoutContext.addConstraint(symbol.height, kiwi.Operator.Eq, first.height, kiwi.Strength.strong)
    }
  }
}
