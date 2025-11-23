// src/layout/hint/grid_builder.ts

import type { ContainerSymbolId, SymbolId } from "../../model/types"
import type { HintFactory } from "../../dsl/hint_factory"
import { isRectMatrix } from "../../dsl/matrix_utils"

/**
 * Grid レイアウト用の Builder
 * 矩形行列（N×M）の配置をサポート
 */
export class GridBuilder {
  private matrix?: SymbolId[][]
  private options: {
    rowGap?: number
    colGap?: number
    padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
  } = {}

  constructor(
    private readonly hint: HintFactory,
    private readonly container: ContainerSymbolId
  ) {}

  /**
   * 配置するシンボルを指定（矩形行列）
   * @param matrix - N×M の矩形行列
   * @throws 矩形でない場合はエラー
   */
  enclose(matrix: SymbolId[][]): this {
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

    const children = this.matrix.flat()

    // metadata 設定（nestLevel, containerId, registerChild）
    this.applyContainerMetadata(children)

    // 制約を適用
    this.hint.getLayoutContext().constraints.encloseGrid(this.container, this.matrix, this.options)
  }

  private applyContainerMetadata(children: SymbolId[]): void {
    const container = this.hint.getSymbols().find((s) => s.id === this.container)
    if (!container) return

    const containerNestLevel = container.nestLevel

    for (const childId of children) {
      const child = this.hint.getSymbols().find((s) => s.id === childId)
      if (child) {
        child.nestLevel = containerNestLevel + 1
        child.containerId = this.container

        // ContainerSymbolBase の場合は registerChild
        if ("registerChild" in container && typeof container.registerChild === "function") {
          container.registerChild(childId)
        }
      }
    }
  }
}
