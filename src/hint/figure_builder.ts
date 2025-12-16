// src/hint/figure_builder.ts

import type { SymbolId } from "../core"
import type { HintFactory, SymbolOrId } from "../dsl"
import { toSymbolId } from "../dsl"

/**
 * Figure レイアウト用の Builder
 * 非矩形配置（行ごとに異なる要素数）をサポート
 */
export class FigureBuilder {
  private rows?: SymbolOrId[][]
  private options: {
    rowGap?: number
    align?: "left" | "center" | "right"
    padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
  } = {}

  constructor(
    private readonly hint: HintFactory,
    private readonly container: SymbolId
  ) {}

  /**
   * 配置するシンボルを指定（行配列）
   * @param rows - 行ごとの配列（各行の要素数は異なってもOK）
   */
  enclose(rows: SymbolOrId[][]): this {
    this.rows = rows
    return this
  }

  /**
   * gap を設定（行間のみ）
   * @param gap - 行間の間隔
   */
  gap(gap: number): this {
    this.options.rowGap = gap
    return this
  }

  /**
   * 水平方向の揃え位置を設定
   * @param align - 'left' | 'center' | 'right'
   */
  align(align: "left" | "center" | "right"): this {
    this.options.align = align
    return this
  }

  /**
   * padding を設定
   * @param padding - 数値の場合は全方向共通、オブジェクトの場合は個別指定
   */
  padding(
    padding: number | { top?: number; right?: number; bottom?: number; left?: number }
  ): this {
    this.options.padding = padding
    return this
  }

  /**
   * レイアウトを適用（最後に呼ぶ）
   * @throws enclose() が呼ばれていない場合はエラー
   */
  layout(): void {
    if (!this.rows) {
      throw new Error("enclose() must be called before layout()")
    }

    const resolvedRows = this.rows.map((row) => row.map(toSymbolId))

    const rowTargets = resolvedRows.map((row) => this.hint.resolveConstraintTargets(row))
    const containerTarget = this.hint.getConstraintTarget(this.container)
    if (!containerTarget) return

    // Note: Depth metadata (nestLevel) is no longer applied here.
    // Z-depth constraints should be handled by hints.encloseFigure via layout.z constraints.
    // TODO: Verify that hints.encloseFigure adds proper z constraints for container/child relationships

    // 制約を適用
    this.hint.getLayoutContext().hints.encloseFigure(containerTarget, rowTargets, this.options)
  }

  // Removed: applyContainerMetadata method that mutated nestLevel
}
