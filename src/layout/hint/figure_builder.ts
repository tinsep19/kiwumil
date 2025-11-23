// src/layout/hint/figure_builder.ts

import type { ContainerSymbolId, SymbolId } from "../../model/types"
import type { HintFactory } from "../../dsl/hint_factory"

/**
 * Figure レイアウト用の Builder
 * 非矩形配置（行ごとに異なる要素数）をサポート
 */
export class FigureBuilder {
  private rows?: SymbolId[][]
  private options: {
    rowGap?: number
    align?: "left" | "center" | "right"
    padding?: number | { top?: number; right?: number; bottom?: number; left?: number }
  } = {}

  constructor(
    private readonly hint: HintFactory,
    private readonly container: ContainerSymbolId
  ) {}

  /**
   * 配置するシンボルを指定（行配列）
   * @param rows - 行ごとの配列（各行の要素数は異なってもOK）
   */
  enclose(rows: SymbolId[][]): this {
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

    const children = this.rows.flat()

    // metadata 設定（nestLevel, containerId, registerChild）
    this.applyContainerMetadata(children)

    // 制約を適用
    this.hint.getLayoutContext().constraints.encloseFigure(this.container, this.rows, this.options)
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
