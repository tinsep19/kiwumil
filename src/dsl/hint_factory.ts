// src/dsl/hint_factory.ts
import type { SymbolId } from "../model/types"
import type { SymbolBase } from "../model/symbol_base"
import type { Theme } from "../core/theme"
import type { LayoutVariableContext, LayoutVar } from "../layout/layout_variable_context"
import { LayoutConstraintOperator, LayoutConstraintStrength } from "../layout/layout_variable_context"

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
    return new GuideBuilderX(
      this.layoutContext,
      this.hints,
      this.theme,
      (id: SymbolId) => this.findSymbolById(id),
      `guideX-${this.guideCounter++}`,
      value
    )
  }

  createGuideY(value?: number) {
    return new GuideBuilderY(
      this.layoutContext,
      this.hints,
      this.theme,
      (id: SymbolId) => this.findSymbolById(id),
      `guideY-${this.guideCounter++}`,
      value
    )
  }

  private findSymbolById(id: SymbolId) {
    return this.symbols.find(s => s.id === id)
  }
}

export class GuideBuilderX {
  readonly x: LayoutVar
  private readonly alignedSymbols = new Set<SymbolId>()
  private hasFollowConstraint = false

  constructor(
    private readonly ctx: LayoutVariableContext,
    private readonly hints: LayoutHint[],
    private readonly theme: Theme,
    private readonly resolveSymbol: (id: SymbolId) => SymbolBase | undefined,
    variableName: string,
    initialValue?: number
  ) {
    this.x = this.ctx.createVar(variableName)
    if (typeof initialValue === "number") {
      this.ctx.addConstraint(this.x, LayoutConstraintOperator.Eq, initialValue)
    }
  }

  alignLeft(...symbolIds: SymbolId[]) {
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.ctx)
      this.ctx.addConstraint(
        bounds.x,
        LayoutConstraintOperator.Eq,
        this.x,
        LayoutConstraintStrength.Strong
      )
    }
    return this
  }

  alignRight(...symbolIds: SymbolId[]) {
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.ctx)
      this.ctx.addConstraint(
        this.ctx.expression([
          { variable: bounds.x },
          { variable: bounds.width }
        ]),
        LayoutConstraintOperator.Eq,
        this.x,
        LayoutConstraintStrength.Strong
      )
    }
    return this
  }

  alignCenter(...symbolIds: SymbolId[]) {
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.ctx)
      this.ctx.addConstraint(
        this.ctx.expression([
          { variable: bounds.x },
          { variable: bounds.width, coefficient: 0.5 }
        ]),
        LayoutConstraintOperator.Eq,
        this.x,
        LayoutConstraintStrength.Strong
      )
    }
    return this
  }

  followLeft(symbolId: SymbolId) {
    this.ensureFollowAvailable("followLeft")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.ctx)
    this.ctx.addConstraint(
      this.x,
      LayoutConstraintOperator.Eq,
      bounds.x,
      LayoutConstraintStrength.Strong
    )
    return this
  }

  followRight(symbolId: SymbolId) {
    this.ensureFollowAvailable("followRight")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.ctx)
    this.ctx.addConstraint(
      this.x,
      LayoutConstraintOperator.Eq,
      this.ctx.expression([
        { variable: bounds.x },
        { variable: bounds.width }
      ]),
      LayoutConstraintStrength.Strong
    )
    return this
  }

  followCenter(symbolId: SymbolId) {
    this.ensureFollowAvailable("followCenter")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.ctx)
    this.ctx.addConstraint(
      this.x,
      LayoutConstraintOperator.Eq,
      this.ctx.expression([
        { variable: bounds.x },
        { variable: bounds.width, coefficient: 0.5 }
      ]),
      LayoutConstraintStrength.Strong
    )
    return this
  }

  arrange(gap?: number) {
    if (this.alignedSymbols.size === 0) return this
    this.hints.push({
      type: "arrangeVertical",
      symbolIds: Array.from(this.alignedSymbols),
      gap: gap ?? this.theme.defaultStyleSet.verticalGap
    })
    return this
  }

  private collect(symbolIds: SymbolId[]) {
    for (const id of symbolIds) {
      this.alignedSymbols.add(id)
    }
  }

  private ensureFollowAvailable(method: string) {
    if (this.hasFollowConstraint) {
      throw new Error(
        `GuideBuilderX.${method}(): guide already follows another symbol. Create a new guide for multiple follow constraints.`
      )
    }
    this.hasFollowConstraint = true
  }
}

export class GuideBuilderY {
  readonly y: LayoutVar
  private readonly alignedSymbols = new Set<SymbolId>()
  private hasFollowConstraint = false

  constructor(
    private readonly ctx: LayoutVariableContext,
    private readonly hints: LayoutHint[],
    private readonly theme: Theme,
    private readonly resolveSymbol: (id: SymbolId) => SymbolBase | undefined,
    variableName: string,
    initialValue?: number
  ) {
    this.y = this.ctx.createVar(variableName)
    if (typeof initialValue === "number") {
      this.ctx.addConstraint(this.y, LayoutConstraintOperator.Eq, initialValue)
    }
  }

  alignTop(...symbolIds: SymbolId[]) {
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.ctx)
      this.ctx.addConstraint(
        bounds.y,
        LayoutConstraintOperator.Eq,
        this.y,
        LayoutConstraintStrength.Strong
      )
    }
    return this
  }

  alignBottom(...symbolIds: SymbolId[]) {
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.ctx)
      this.ctx.addConstraint(
        this.ctx.expression([
          { variable: bounds.y },
          { variable: bounds.height }
        ]),
        LayoutConstraintOperator.Eq,
        this.y,
        LayoutConstraintStrength.Strong
      )
    }
    return this
  }

  alignCenter(...symbolIds: SymbolId[]) {
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.ctx)
      this.ctx.addConstraint(
        this.ctx.expression([
          { variable: bounds.y },
          { variable: bounds.height, coefficient: 0.5 }
        ]),
        LayoutConstraintOperator.Eq,
        this.y,
        LayoutConstraintStrength.Strong
      )
    }
    return this
  }

  followTop(symbolId: SymbolId) {
    this.ensureFollowAvailable("followTop")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.ctx)
    this.ctx.addConstraint(
      this.y,
      LayoutConstraintOperator.Eq,
      bounds.y,
      LayoutConstraintStrength.Strong
    )
    return this
  }

  followBottom(symbolId: SymbolId) {
    this.ensureFollowAvailable("followBottom")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.ctx)
    this.ctx.addConstraint(
      this.y,
      LayoutConstraintOperator.Eq,
      this.ctx.expression([
        { variable: bounds.y },
        { variable: bounds.height }
      ]),
      LayoutConstraintStrength.Strong
    )
    return this
  }

  followCenter(symbolId: SymbolId) {
    this.ensureFollowAvailable("followCenter")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.ctx)
    this.ctx.addConstraint(
      this.y,
      LayoutConstraintOperator.Eq,
      this.ctx.expression([
        { variable: bounds.y },
        { variable: bounds.height, coefficient: 0.5 }
      ]),
      LayoutConstraintStrength.Strong
    )
    return this
  }

  arrange(gap?: number) {
    if (this.alignedSymbols.size === 0) return this
    this.hints.push({
      type: "arrangeHorizontal",
      symbolIds: Array.from(this.alignedSymbols),
      gap: gap ?? this.theme.defaultStyleSet.horizontalGap
    })
    return this
  }

  private collect(symbolIds: SymbolId[]) {
    for (const id of symbolIds) {
      this.alignedSymbols.add(id)
    }
  }

  private ensureFollowAvailable(method: string) {
    if (this.hasFollowConstraint) {
      throw new Error(
        `GuideBuilderY.${method}(): guide already follows another symbol. Create a new guide for multiple follow constraints.`
      )
    }
    this.hasFollowConstraint = true
  }
}
