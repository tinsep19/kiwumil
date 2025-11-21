// src/dsl/hint_factory.ts
import type { ContainerSymbolId, SymbolId } from "../model/types"
import { DIAGRAM_CONTAINER_ID } from "../model/types"
import type { SymbolBase } from "../model/symbol_base"
import { LayoutConstraintOperator, LayoutConstraintStrength, type LayoutVar } from "../layout/layout_variables"
import type { LayoutContext } from "../layout/layout_context"
import { ContainerSymbolBase } from "../model/container_symbol_base"
import { GridBuilder } from "./grid_builder"
import { FigureBuilder } from "./figure_builder"
import { Symbols } from "./symbols"

type LayoutTargetId = SymbolId | ContainerSymbolId

export class HintFactory {
  private guideCounter = 0

  constructor(
    private readonly layout: LayoutContext,
    private readonly symbols: Symbols
  ) {}

  /**
   * Grid Builder を返す（矩形行列レイアウト用）
   * @param container コンテナID。省略時は diagram 全体（DIAGRAM_CONTAINER_ID）を対象とする
   */
  grid(container?: ContainerSymbolId): GridBuilder {
    const targetContainer = container ?? DIAGRAM_CONTAINER_ID
    return new GridBuilder(this, targetContainer)
  }

  /**
   * Figure Builder を返す（非矩形レイアウト用）
   * @param container コンテナID。省略時は diagram 全体（DIAGRAM_CONTAINER_ID）を対象とする
   */
  figure(container?: ContainerSymbolId): FigureBuilder {
    const targetContainer = container ?? DIAGRAM_CONTAINER_ID
    return new FigureBuilder(this, targetContainer)
  }

  /**
   * LayoutContext を取得（Builder から参照）
   */
  getLayoutContext(): LayoutContext {
    return this.layout
  }

  /**
   * Symbols 配列を取得（Builder から参照）
   */
  getSymbols(): readonly SymbolBase[] {
    return this.symbols.getAll()
  }

  horizontal(...symbolIds: LayoutTargetId[]) {
    this.arrangeHorizontal(...symbolIds)
  }

  vertical(...symbolIds: LayoutTargetId[]) {
    this.arrangeVertical(...symbolIds)
  }

  arrangeHorizontal(...symbolIds: LayoutTargetId[]) {
    this.layout.constraints.arrangeHorizontal(symbolIds)
  }

  arrangeVertical(...symbolIds: LayoutTargetId[]) {
    this.layout.constraints.arrangeVertical(symbolIds)
  }

  alignLeft(...symbolIds: LayoutTargetId[]) {
    this.layout.constraints.alignLeft(symbolIds)
  }

  alignRight(...symbolIds: LayoutTargetId[]) {
    this.layout.constraints.alignRight(symbolIds)
  }

  alignTop(...symbolIds: LayoutTargetId[]) {
    this.layout.constraints.alignTop(symbolIds)
  }

  alignBottom(...symbolIds: LayoutTargetId[]) {
    this.layout.constraints.alignBottom(symbolIds)
  }

  alignCenterX(...symbolIds: LayoutTargetId[]) {
    this.layout.constraints.alignCenterX(symbolIds)
  }

  alignCenterY(...symbolIds: LayoutTargetId[]) {
    this.layout.constraints.alignCenterY(symbolIds)
  }

  alignWidth(...symbolIds: LayoutTargetId[]) {
    this.layout.constraints.alignWidth(symbolIds)
  }

  alignHeight(...symbolIds: LayoutTargetId[]) {
    this.layout.constraints.alignHeight(symbolIds)
  }

  alignSize(...symbolIds: LayoutTargetId[]) {
    this.layout.constraints.alignSize(symbolIds)
  }

  enclose(containerId: ContainerSymbolId, childIds: LayoutTargetId[]) {
    const container = this.symbols.findById(containerId)
    if (container) {
      const containerNestLevel = container.nestLevel
      for (const childId of childIds) {
        const child = this.symbols.findById(childId)
        if (child) {
          child.nestLevel = containerNestLevel + 1
          child.containerId = containerId
          if (container instanceof ContainerSymbolBase) {
            container.registerChild(childId)
          }
        }
      }
    }

    this.layout.constraints.enclose(containerId, childIds)
  }

  createGuideX(value?: number) {
    return new GuideBuilderX(
      this.layout,
      (id: LayoutTargetId) => this.findSymbolById(id),
      `guideX-${this.guideCounter++}`,
      value
    )
  }

  createGuideY(value?: number) {
    return new GuideBuilderY(
      this.layout,
      (id: LayoutTargetId) => this.findSymbolById(id),
      `guideY-${this.guideCounter++}`,
      value
    )
  }

  private findSymbolById(id: LayoutTargetId) {
    return this.symbols.findById(id)
  }
}

export class GuideBuilderX {
  readonly x: LayoutVar
  private readonly alignedSymbols = new Set<LayoutTargetId>()
  private hasFollowConstraint = false

  constructor(
    private readonly layout: LayoutContext,
    private readonly resolveSymbol: (id: LayoutTargetId) => SymbolBase | undefined,
    variableName: string,
    initialValue?: number
  ) {
    this.x = this.layout.vars.createVar(variableName)
    if (typeof initialValue === "number") {
      this.layout.getSolver().addConstraint(this.x, LayoutConstraintOperator.Eq, initialValue)
    }
  }

  alignLeft(...symbolIds: LayoutTargetId[]) {
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.layout.vars)
      this.layout.getSolver().addConstraint(
        bounds.x,
        LayoutConstraintOperator.Eq,
        this.x,
        LayoutConstraintStrength.Strong
      )
    }
    return this
  }

  alignRight(...symbolIds: LayoutTargetId[]) {
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.layout.vars)
      this.layout.getSolver().addConstraint(
        bounds.right,
        LayoutConstraintOperator.Eq,
        this.x,
        LayoutConstraintStrength.Strong
      )
    }
    return this
  }

  alignCenter(...symbolIds: LayoutTargetId[]) {
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.layout.vars)
      this.layout.getSolver().addConstraint(
        bounds.centerX,
        LayoutConstraintOperator.Eq,
        this.x,
        LayoutConstraintStrength.Strong
      )
    }
    return this
  }

  followLeft(symbolId: LayoutTargetId) {
    this.ensureFollowAvailable("followLeft")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.layout.vars)
    this.layout.getSolver().addConstraint(
      this.x,
      LayoutConstraintOperator.Eq,
      bounds.x,
      LayoutConstraintStrength.Strong
    )
    return this
  }

  followRight(symbolId: LayoutTargetId) {
    this.ensureFollowAvailable("followRight")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.layout.vars)
    this.layout.getSolver().addConstraint(
      this.x,
      LayoutConstraintOperator.Eq,
      bounds.right,
      LayoutConstraintStrength.Strong
    )
    return this
  }

  followCenter(symbolId: LayoutTargetId) {
    this.ensureFollowAvailable("followCenter")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.layout.vars)
    this.layout.getSolver().addConstraint(
      this.x,
      LayoutConstraintOperator.Eq,
      bounds.centerX,
      LayoutConstraintStrength.Strong
    )
    return this
  }

  arrange(gap?: number) {
    if (this.alignedSymbols.size === 0) return this
    this.layout.constraints.arrangeVertical(
      Array.from(this.alignedSymbols),
      gap ?? this.layout.theme.defaultStyleSet.verticalGap
    )
    return this
  }

  private collect(symbolIds: LayoutTargetId[]) {
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
  private readonly alignedSymbols = new Set<LayoutTargetId>()
  private hasFollowConstraint = false

  constructor(
    private readonly layout: LayoutContext,
    private readonly resolveSymbol: (id: LayoutTargetId) => SymbolBase | undefined,
    variableName: string,
    initialValue?: number
  ) {
    this.y = this.layout.vars.createVar(variableName)
    if (typeof initialValue === "number") {
      this.layout.getSolver().addConstraint(this.y, LayoutConstraintOperator.Eq, initialValue)
    }
  }

  alignTop(...symbolIds: LayoutTargetId[]) {
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.layout.vars)
      this.layout.getSolver().addConstraint(
        bounds.y,
        LayoutConstraintOperator.Eq,
        this.y,
        LayoutConstraintStrength.Strong
      )
    }
    return this
  }

  alignBottom(...symbolIds: LayoutTargetId[]) {
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.layout.vars)
      this.layout.getSolver().addConstraint(
        bounds.bottom,
        LayoutConstraintOperator.Eq,
        this.y,
        LayoutConstraintStrength.Strong
      )
    }
    return this
  }

  alignCenter(...symbolIds: LayoutTargetId[]) {
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.ensureLayoutBounds(this.layout.vars)
      this.layout.getSolver().addConstraint(
        bounds.centerY,
        LayoutConstraintOperator.Eq,
        this.y,
        LayoutConstraintStrength.Strong
      )
    }
    return this
  }

  followTop(symbolId: LayoutTargetId) {
    this.ensureFollowAvailable("followTop")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.layout.vars)
    this.layout.getSolver().addConstraint(
      this.y,
      LayoutConstraintOperator.Eq,
      bounds.y,
      LayoutConstraintStrength.Strong
    )
    return this
  }

  followBottom(symbolId: LayoutTargetId) {
    this.ensureFollowAvailable("followBottom")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.layout.vars)
    this.layout.getSolver().addConstraint(
      this.y,
      LayoutConstraintOperator.Eq,
      bounds.bottom,
      LayoutConstraintStrength.Strong
    )
    return this
  }

  followCenter(symbolId: LayoutTargetId) {
    this.ensureFollowAvailable("followCenter")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.ensureLayoutBounds(this.layout.vars)
    this.layout.getSolver().addConstraint(
      this.y,
      LayoutConstraintOperator.Eq,
      bounds.centerY,
      LayoutConstraintStrength.Strong
    )
    return this
  }

  arrange(gap?: number) {
    if (this.alignedSymbols.size === 0) return this
    this.layout.constraints.arrangeHorizontal(
      Array.from(this.alignedSymbols),
      gap ?? this.layout.theme.defaultStyleSet.horizontalGap
    )
    return this
  }

  private collect(symbolIds: LayoutTargetId[]) {
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
