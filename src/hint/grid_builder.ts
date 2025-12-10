// src/hint/grid_builder.ts

import type { SymbolId } from "../core"
import type { HintFactory } from "../dsl"
import { isRectMatrix, toSymbolId, type SymbolOrId } from "../dsl"

/**
 * Grid レイアウト用の Builder
 * 矩形行列（N×M）の配置をサポート
 */
export class GridBuilder {
  private matrix?: SymbolOrId[][]
  private options: {
    rowGap?: number
    colGap?: number
    padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
  } = {}

  constructor(
    private readonly hint: HintFactory,
    private readonly container: SymbolId
  ) {}

  /**
   * 配置するシンボルを指定（矩形行列）
   * @param matrix - N×M の矩形行列
   * @throws 矩形でない場合はエラー
   */
  enclose(matrix: SymbolOrId[][]): this {
    if (!isRectMatrix(matrix)) {
      throw new Error(
        "GridBuilder.enclose() requires a rectangular matrix. Use FigureBuilder for non-rectangular layouts."
      )
    }
    this.matrix = matrix
    return this
  }

  /**
   * gap を設定
   * @param gap - 数値の場合は行・列共通、オブジェクトの場合は個別指定
   */
  gap(gap: number | { row?: number; col?: number }): this {
    if (typeof gap === "number") {
      this.options.rowGap = gap
      this.options.colGap = gap
    } else {
      this.options.rowGap = gap.row
      this.options.colGap = gap.col
    }
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
    if (!this.matrix) {
      throw new Error("enclose() must be called before layout()")
    }

    const resolvedMatrix = this.matrix.map((row) => row.map(toSymbolId))
    const children = resolvedMatrix.flat()
    const matrixTargets = resolvedMatrix.map((row) => this.hint.resolveConstraintTargets(row))
    const containerTarget = this.hint.getConstraintTarget(this.container)
    if (!containerTarget) return

    // Note: Depth metadata (nestLevel) is no longer applied here.
    // Z-depth constraints should be handled by hints.encloseGrid via layout.z constraints.
    // TODO: Verify that hints.encloseGrid adds proper z constraints for container/child relationships

    // 制約を適用
    this.hint
      .getLayoutContext()
      .hints.encloseGrid(containerTarget, matrixTargets, this.options)
  }

  // Removed: applyContainerMetadata method that mutated nestLevel
}
