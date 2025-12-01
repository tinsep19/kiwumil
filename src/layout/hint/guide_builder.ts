// src/layout/hint/guide_builder.ts
import type { ContainerSymbolId, SymbolBase, SymbolId } from "../../model"
import type { LayoutContext, LayoutConstraintTarget, LayoutVar, Term } from "../layout"

type LayoutTargetId = SymbolId | ContainerSymbolId

/**
 * GuideBuilderX インターフェイス
 * X軸（水平方向）のガイドビルダー
 */
export interface GuideBuilderX {
  readonly x: LayoutVar
  alignLeft(...symbolIds: LayoutTargetId[]): this
  alignRight(...symbolIds: LayoutTargetId[]): this
  alignCenter(...symbolIds: LayoutTargetId[]): this
  followLeft(symbolId: LayoutTargetId): this
  followRight(symbolId: LayoutTargetId): this
  followCenter(symbolId: LayoutTargetId): this
  arrange(gap?: number): this
}

/**
 * GuideBuilderY インターフェイス
 * Y軸（垂直方向）のガイドビルダー
 */
export interface GuideBuilderY {
  readonly y: LayoutVar
  alignTop(...symbolIds: LayoutTargetId[]): this
  alignBottom(...symbolIds: LayoutTargetId[]): this
  alignCenter(...symbolIds: LayoutTargetId[]): this
  followTop(symbolId: LayoutTargetId): this
  followBottom(symbolId: LayoutTargetId): this
  followCenter(symbolId: LayoutTargetId): this
  arrange(gap?: number): this
}

type Axis = "x" | "y"

/**
 * GuideBuilder の共通実装
 * axis パラメータによって X軸 または Y軸 の振る舞いを切り替える
 */
export class GuideBuilderImpl implements GuideBuilderX, GuideBuilderY {
  readonly x!: LayoutVar
  readonly y!: LayoutVar
  private readonly guideVar: LayoutVar
  private readonly alignedSymbols = new Set<LayoutTargetId>()
  private hasFollowConstraint = false

  constructor(
    private readonly context: LayoutContext,
    private readonly resolveSymbol: (id: LayoutTargetId) => SymbolBase | undefined,
    private readonly resolveTarget: (id: LayoutTargetId) => LayoutConstraintTarget | undefined,
    private readonly axis: Axis,
    variableName: string,
    initialValue?: number
  ) {
    this.guideVar = this.context.variables.createVar(variableName)

    // axis に応じて x または y プロパティを設定
    if (axis === "x") {
      this.x = this.guideVar
    } else {
      this.y = this.guideVar
    }

    if (typeof initialValue === "number") {
      this.context
        .createConstraintsBuilder()
        .expr([1, this.guideVar])
        .eq([initialValue, 1])
        .strong()
    }
  }

  // X軸専用メソッド
  alignLeft(...symbolIds: LayoutTargetId[]): this {
    this.ensureAxisIs("x", "alignLeft")
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.layout
      this.enforceStrongEquality([[1, bounds.x]], [[1, this.guideVar]])
    }
    return this
  }

  alignRight(...symbolIds: LayoutTargetId[]): this {
    this.ensureAxisIs("x", "alignRight")
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.layout
      this.enforceStrongEquality([[1, bounds.right]], [[1, this.guideVar]])
    }
    return this
  }

  followLeft(symbolId: LayoutTargetId): this {
    this.ensureAxisIs("x", "followLeft")
    this.ensureFollowAvailable("followLeft")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.layout
    this.enforceStrongEquality([[1, this.guideVar]], [[1, bounds.x]])
    return this
  }

  followRight(symbolId: LayoutTargetId): this {
    this.ensureAxisIs("x", "followRight")
    this.ensureFollowAvailable("followRight")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.layout
    this.enforceStrongEquality([[1, this.guideVar]], [[1, bounds.right]])
    return this
  }

  // Y軸専用メソッド
  alignTop(...symbolIds: LayoutTargetId[]): this {
    this.ensureAxisIs("y", "alignTop")
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.layout
      this.enforceStrongEquality([[1, bounds.y]], [[1, this.guideVar]])
    }
    return this
  }

  alignBottom(...symbolIds: LayoutTargetId[]): this {
    this.ensureAxisIs("y", "alignBottom")
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.layout
      this.enforceStrongEquality([[1, bounds.bottom]], [[1, this.guideVar]])
    }
    return this
  }

  followTop(symbolId: LayoutTargetId): this {
    this.ensureAxisIs("y", "followTop")
    this.ensureFollowAvailable("followTop")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.layout
    this.enforceStrongEquality([[1, this.guideVar]], [[1, bounds.y]])
    return this
  }

  followBottom(symbolId: LayoutTargetId): this {
    this.ensureAxisIs("y", "followBottom")
    this.ensureFollowAvailable("followBottom")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.layout
    this.enforceStrongEquality([[1, this.guideVar]], [[1, bounds.bottom]])
    return this
  }

  // 共通メソッド（X軸とY軸で振る舞いが異なる）
  alignCenter(...symbolIds: LayoutTargetId[]): this {
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.layout
      const targetVar = this.axis === "x" ? bounds.centerX : bounds.centerY
      this.enforceStrongEquality([[1, targetVar]], [[1, this.guideVar]])
    }
    return this
  }

  followCenter(symbolId: LayoutTargetId): this {
    this.ensureFollowAvailable("followCenter")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.layout
    const targetVar = this.axis === "x" ? bounds.centerX : bounds.centerY
    this.enforceStrongEquality([[1, this.guideVar]], [[1, targetVar]])
    return this
  }

  arrange(gap?: number): this {
    const targets = this.getAlignedTargets()
    if (targets.length === 0) return this

    if (this.axis === "x") {
      // X軸ガイドの場合は垂直方向に並べる
      this.context.constraints.arrangeVertical(
        targets,
        gap ?? this.context.theme.defaultStyleSet.verticalGap
      )
    } else {
      // Y軸ガイドの場合は水平方向に並べる
      this.context.constraints.arrangeHorizontal(
        targets,
        gap ?? this.context.theme.defaultStyleSet.horizontalGap
      )
    }
    return this
  }

  private collect(symbolIds: LayoutTargetId[]) {
    for (const id of symbolIds) {
      this.alignedSymbols.add(id)
    }
  }

  private getAlignedTargets(): LayoutConstraintTarget[] {
    return Array.from(this.alignedSymbols)
      .map((id) => this.resolveTarget(id))
      .filter((target): target is LayoutConstraintTarget => Boolean(target))
  }

  private enforceStrongEquality(lhs: Term[], rhs: Term[]) {
    this.context
      .createConstraintsBuilder()
      .expr(...lhs)
      .eq(...rhs)
      .strong()
  }

  private ensureFollowAvailable(method: string) {
    if (this.hasFollowConstraint) {
      const builderType = this.axis === "x" ? "GuideBuilderX" : "GuideBuilderY"
      throw new Error(
        `${builderType}.${method}(): guide already follows another symbol. Create a new guide for multiple follow constraints.`
      )
    }
    this.hasFollowConstraint = true
  }

  private ensureAxisIs(expectedAxis: Axis, method: string) {
    if (this.axis !== expectedAxis) {
      const builderType = this.axis === "x" ? "GuideBuilderX" : "GuideBuilderY"
      const expectedType = expectedAxis === "x" ? "GuideBuilderX" : "GuideBuilderY"
      throw new Error(
        `${builderType}.${method}(): This method is only available for ${expectedType}`
      )
    }
  }
}
