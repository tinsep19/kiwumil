// src/dsl/hint_factory.ts
import type { ContainerSymbolId, SymbolId } from "../model/types"
import { DIAGRAM_CONTAINER_ID } from "../model/types"
import type { SymbolBase } from "../model/symbol_base"
import type { LayoutContext } from "../layout/layout_context"
import { ContainerSymbolBase } from "../model/container_symbol_base"
import { GridBuilder } from "./grid_builder"
import { FigureBuilder } from "./figure_builder"
import { Symbols } from "./symbols"
import { GuideBuilderImpl, type GuideBuilderX, type GuideBuilderY } from "./guide_builder"

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

  createGuideX(value?: number): GuideBuilderX {
    return new GuideBuilderImpl(
      this.layout,
      (id: LayoutTargetId) => this.findSymbolById(id),
      "x",
      `guideX-${this.guideCounter++}`,
      value
    )
  }

  createGuideY(value?: number): GuideBuilderY {
    return new GuideBuilderImpl(
      this.layout,
      (id: LayoutTargetId) => this.findSymbolById(id),
      "y",
      `guideY-${this.guideCounter++}`,
      value
    )
  }

  private findSymbolById(id: LayoutTargetId) {
    return this.symbols.findById(id)
  }
}
