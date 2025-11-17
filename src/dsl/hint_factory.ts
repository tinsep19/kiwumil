// src/dsl/hint_factory.ts
import * as kiwi from "@lume/kiwi"
import type { SymbolId } from "../model/types"
import type { SymbolBase } from "../model/symbol_base"
import type { Theme } from "../core/theme"
import type { LayoutVariableContext, LayoutVar } from "../layout/layout_variable_context"

export interface LayoutHint {
  type: 
    | "horizontal"           // deprecated: use arrangeHorizontal
    | "vertical"             // deprecated: use arrangeVertical
    | "arrangeHorizontal"
    | "arrangeVertical"
    | "alignLeft"
    | "alignRight"
    | "alignTop"
    | "alignBottom"
    | "alignCenterX"
    | "alignCenterY"
    | "alignWidth"
    | "alignHeight"
    | "alignSize"
    | "enclose"
  symbolIds: SymbolId[]
  gap?: number
  containerId?: SymbolId
  childIds?: SymbolId[]
}

export class HintFactory {
  constructor(
    private hints: LayoutHint[],
    private symbols: SymbolBase[],
    private theme: Theme,
    private layoutContext: LayoutVariableContext
  ) {}
  private guideCounter = 0

  horizontal(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "horizontal",
      symbolIds,
      gap: this.theme.defaultStyleSet.horizontalGap
    })
  }

  vertical(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "vertical",
      symbolIds,
      gap: this.theme.defaultStyleSet.verticalGap
    })
  }

  // New Arrange methods
  arrangeHorizontal(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "arrangeHorizontal",
      symbolIds,
      gap: this.theme.defaultStyleSet.horizontalGap
    })
  }

  arrangeVertical(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "arrangeVertical",
      symbolIds,
      gap: this.theme.defaultStyleSet.verticalGap
    })
  }

  // New Align methods
  alignLeft(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignLeft",
      symbolIds
    })
  }

  alignRight(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignRight",
      symbolIds
    })
  }

  alignTop(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignTop",
      symbolIds
    })
  }

  alignBottom(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignBottom",
      symbolIds
    })
  }

  alignCenterX(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignCenterX",
      symbolIds
    })
  }

  alignCenterY(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignCenterY",
      symbolIds
    })
  }

  alignWidth(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignWidth",
      symbolIds
    })
  }

  alignHeight(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignHeight",
      symbolIds
    })
  }

  alignSize(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignSize",
      symbolIds
    })
  }

  enclose(containerId: SymbolId, childIds: SymbolId[]) {
    // Set nestLevel for children
    const container = this.symbols.find(s => s.id === containerId)
    if (container) {
      const containerNestLevel = container.nestLevel
      for (const childId of childIds) {
        const child = this.symbols.find(s => s.id === childId)
        if (child) {
          child.nestLevel = containerNestLevel + 1
          child.containerId = containerId
        }
      }
    }

    this.hints.push({
      type: "enclose",
      symbolIds: [],
      containerId,
      childIds
    })
  }

  createGuideX(value?: number) {
    const variable = this.layoutContext.createVar(`guideX-${this.guideCounter++}`)
    if (typeof value === "number") {
      this.layoutContext.addConstraint(variable, kiwi.Operator.Eq, value)
    }
    return new HorizontalGuide(
      this.layoutContext,
      variable,
      (id: SymbolId) => this.findSymbolById(id)
    )
  }

  createGuideY(value?: number) {
    const variable = this.layoutContext.createVar(`guideY-${this.guideCounter++}`)
    if (typeof value === "number") {
      this.layoutContext.addConstraint(variable, kiwi.Operator.Eq, value)
    }
    return new VerticalGuide(
      this.layoutContext,
      variable,
      (id: SymbolId) => this.findSymbolById(id)
    )
  }

  private findSymbolById(id: SymbolId) {
    return this.symbols.find(s => s.id === id)
  }
}

export class HorizontalGuide {
  constructor(
    private ctx: LayoutVariableContext,
    private variable: LayoutVar,
    private resolveSymbol: (id: SymbolId) => SymbolBase | undefined
  ) {}

  alignLeft(...symbolIds: SymbolId[]) {
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.ctx)
      this.ctx.addConstraint(bounds.x, kiwi.Operator.Eq, this.variable, kiwi.Strength.strong)
    }
    return this
  }

  alignRight(...symbolIds: SymbolId[]) {
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.ctx)
      this.ctx.addConstraint(
        this.ctx.expression([
          { variable: bounds.x },
          { variable: bounds.width }
        ]),
        kiwi.Operator.Eq,
        this.variable,
        kiwi.Strength.strong
      )
    }
    return this
  }

  alignCenter(...symbolIds: SymbolId[]) {
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.ctx)
      this.ctx.addConstraint(
        this.ctx.expression([
          { variable: bounds.x },
          { variable: bounds.width, coefficient: 0.5 }
        ]),
        kiwi.Operator.Eq,
        this.variable,
        kiwi.Strength.strong
      )
    }
    return this
  }

  followLeft(symbolId: SymbolId) {
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.ctx)
    this.ctx.addConstraint(this.variable, kiwi.Operator.Eq, bounds.x, kiwi.Strength.strong)
    return this
  }

  followRight(symbolId: SymbolId) {
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.ctx)
    this.ctx.addConstraint(
      this.variable,
      kiwi.Operator.Eq,
      this.ctx.expression([
        { variable: bounds.x },
        { variable: bounds.width }
      ]),
      kiwi.Strength.strong
    )
    return this
  }

  followCenter(symbolId: SymbolId) {
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.ctx)
    this.ctx.addConstraint(
      this.variable,
      kiwi.Operator.Eq,
      this.ctx.expression([
        { variable: bounds.x },
        { variable: bounds.width, coefficient: 0.5 }
      ]),
      kiwi.Strength.strong
    )
    return this
  }

}

export class VerticalGuide {
  constructor(
    private ctx: LayoutVariableContext,
    private variable: LayoutVar,
    private resolveSymbol: (id: SymbolId) => SymbolBase | undefined
  ) {}

  alignTop(...symbolIds: SymbolId[]) {
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.ctx)
      this.ctx.addConstraint(bounds.y, kiwi.Operator.Eq, this.variable, kiwi.Strength.strong)
    }
    return this
  }

  alignBottom(...symbolIds: SymbolId[]) {
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.ctx)
      this.ctx.addConstraint(
        this.ctx.expression([
          { variable: bounds.y },
          { variable: bounds.height }
        ]),
        kiwi.Operator.Eq,
        this.variable,
        kiwi.Strength.strong
      )
    }
    return this
  }

  alignCenter(...symbolIds: SymbolId[]) {
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.ctx)
      this.ctx.addConstraint(
        this.ctx.expression([
          { variable: bounds.y },
          { variable: bounds.height, coefficient: 0.5 }
        ]),
        kiwi.Operator.Eq,
        this.variable,
        kiwi.Strength.strong
      )
    }
    return this
  }

  followTop(symbolId: SymbolId) {
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.ctx)
    this.ctx.addConstraint(this.variable, kiwi.Operator.Eq, bounds.y, kiwi.Strength.strong)
    return this
  }

  followBottom(symbolId: SymbolId) {
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.ctx)
    this.ctx.addConstraint(
      this.variable,
      kiwi.Operator.Eq,
      this.ctx.expression([
        { variable: bounds.y },
        { variable: bounds.height }
      ]),
      kiwi.Strength.strong
    )
    return this
  }

  followCenter(symbolId: SymbolId) {
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.ctx)
    this.ctx.addConstraint(
      this.variable,
      kiwi.Operator.Eq,
      this.ctx.expression([
        { variable: bounds.y },
        { variable: bounds.height, coefficient: 0.5 }
      ]),
      kiwi.Strength.strong
    )
    return this
  }

}
