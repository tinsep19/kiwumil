// src/dsl/guide_builder.ts
import type { ContainerSymbolId, SymbolId } from "../model/types"
import type { SymbolBase } from "../model/symbol_base"
import {
  LayoutConstraintOperator,
  LayoutConstraintStrength,
  type LayoutVar,
} from "../layout/layout_variables"
import type { LayoutContext } from "../layout/layout_context"

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
    private readonly layout: LayoutContext,
    private readonly resolveSymbol: (id: LayoutTargetId) => SymbolBase | undefined,
    private readonly axis: Axis,
    variableName: string,
    initialValue?: number
  ) {
    this.guideVar = this.layout.variables.createVar(variableName)

    // axis に応じて x または y プロパティを設定
    if (axis === "x") {
      this.x = this.guideVar
    } else {
      this.y = this.guideVar
    }

    if (typeof initialValue === "number") {
      this.layout
        .getSolver()
        .addConstraint(this.guideVar, LayoutConstraintOperator.Eq, initialValue)
    }
  }

  // X軸専用メソッド
  alignLeft(...symbolIds: LayoutTargetId[]): this {
    this.ensureAxisIs("x", "alignLeft")
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.getLayoutBounds()
      this.layout
        .getSolver()
        .addConstraint(
          bounds.x,
          LayoutConstraintOperator.Eq,
          this.guideVar,
          LayoutConstraintStrength.Strong
        )
    }
    return this
  }

  alignRight(...symbolIds: LayoutTargetId[]): this {
    this.ensureAxisIs("x", "alignRight")
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.getLayoutBounds()
      this.layout
        .getSolver()
        .addConstraint(
          bounds.right,
          LayoutConstraintOperator.Eq,
          this.guideVar,
          LayoutConstraintStrength.Strong
        )
    }
    return this
  }

  followLeft(symbolId: LayoutTargetId): this {
    this.ensureAxisIs("x", "followLeft")
    this.ensureFollowAvailable("followLeft")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.getLayoutBounds()
    this.layout
      .getSolver()
      .addConstraint(
        this.guideVar,
        LayoutConstraintOperator.Eq,
        bounds.x,
        LayoutConstraintStrength.Strong
      )
    return this
  }

  followRight(symbolId: LayoutTargetId): this {
    this.ensureAxisIs("x", "followRight")
    this.ensureFollowAvailable("followRight")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.getLayoutBounds()
    this.layout
      .getSolver()
      .addConstraint(
        this.guideVar,
        LayoutConstraintOperator.Eq,
        bounds.right,
        LayoutConstraintStrength.Strong
      )
    return this
  }

  // Y軸専用メソッド
  alignTop(...symbolIds: LayoutTargetId[]): this {
    this.ensureAxisIs("y", "alignTop")
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.getLayoutBounds()
      this.layout
        .getSolver()
        .addConstraint(
          bounds.y,
          LayoutConstraintOperator.Eq,
          this.guideVar,
          LayoutConstraintStrength.Strong
        )
    }
    return this
  }

  alignBottom(...symbolIds: LayoutTargetId[]): this {
    this.ensureAxisIs("y", "alignBottom")
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.getLayoutBounds()
      this.layout
        .getSolver()
        .addConstraint(
          bounds.bottom,
          LayoutConstraintOperator.Eq,
          this.guideVar,
          LayoutConstraintStrength.Strong
        )
    }
    return this
  }

  followTop(symbolId: LayoutTargetId): this {
    this.ensureAxisIs("y", "followTop")
    this.ensureFollowAvailable("followTop")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.getLayoutBounds()
    this.layout
      .getSolver()
      .addConstraint(
        this.guideVar,
        LayoutConstraintOperator.Eq,
        bounds.y,
        LayoutConstraintStrength.Strong
      )
    return this
  }

  followBottom(symbolId: LayoutTargetId): this {
    this.ensureAxisIs("y", "followBottom")
    this.ensureFollowAvailable("followBottom")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.getLayoutBounds()
    this.layout
      .getSolver()
      .addConstraint(
        this.guideVar,
        LayoutConstraintOperator.Eq,
        bounds.bottom,
        LayoutConstraintStrength.Strong
      )
    return this
  }

  // 共通メソッド（X軸とY軸で振る舞いが異なる）
  alignCenter(...symbolIds: LayoutTargetId[]): this {
    this.collect(symbolIds)
    for (const id of symbolIds) {
      const symbol = this.resolveSymbol(id)
      if (!symbol) continue
      const bounds = symbol.getLayoutBounds()
      const targetVar = this.axis === "x" ? bounds.centerX : bounds.centerY
      this.layout
        .getSolver()
        .addConstraint(
          targetVar,
          LayoutConstraintOperator.Eq,
          this.guideVar,
          LayoutConstraintStrength.Strong
        )
    }
    return this
  }

  followCenter(symbolId: LayoutTargetId): this {
    this.ensureFollowAvailable("followCenter")
    const symbol = this.resolveSymbol(symbolId)
    if (!symbol) return this
    const bounds = symbol.getLayoutBounds()
    const targetVar = this.axis === "x" ? bounds.centerX : bounds.centerY
    this.layout
      .getSolver()
      .addConstraint(
        this.guideVar,
        LayoutConstraintOperator.Eq,
        targetVar,
        LayoutConstraintStrength.Strong
      )
    return this
  }

  arrange(gap?: number): this {
    if (this.alignedSymbols.size === 0) return this

    if (this.axis === "x") {
      // X軸ガイドの場合は垂直方向に並べる
      this.layout.constraints.arrangeVertical(
        Array.from(this.alignedSymbols),
        gap ?? this.layout.theme.defaultStyleSet.verticalGap
      )
    } else {
      // Y軸ガイドの場合は水平方向に並べる
      this.layout.constraints.arrangeHorizontal(
        Array.from(this.alignedSymbols),
        gap ?? this.layout.theme.defaultStyleSet.horizontalGap
      )
    }
    return this
  }

  private collect(symbolIds: LayoutTargetId[]) {
    for (const id of symbolIds) {
      this.alignedSymbols.add(id)
    }
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
