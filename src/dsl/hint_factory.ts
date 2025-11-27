// src/dsl/hint_factory.ts
import type { ContainerSymbolId } from "../model/types"
import { DIAGRAM_CONTAINER_ID } from "../model/types"
import type { SymbolBase } from "../model/symbol_base"
import type { LayoutContext } from "../layout/layout_context"
import { GridBuilder } from "../layout/hint/grid_builder"
import { FigureBuilder } from "../layout/hint/figure_builder"
import { Symbols } from "./symbols"
import {
  GuideBuilderImpl,
  type GuideBuilderX,
  type GuideBuilderY,
} from "../layout/hint/guide_builder"
import {
  ContainerSymbolOrId,
  toContainerSymbolId,
  toSymbolId,
  type SymbolOrId,
} from "./symbol_helpers"

type LayoutTargetId = SymbolOrId | ContainerSymbolId
type LayoutContainerTarget = ContainerSymbolOrId

export class HintFactory {
  private guideCounter = 0
  private diagramContainer: ContainerSymbolId

  private readonly context: LayoutContext
  private readonly symbols: Symbols

  constructor({
    context,
    symbols,
    diagramContainer = DIAGRAM_CONTAINER_ID,
  }: {
    context: LayoutContext
    symbols: Symbols
    diagramContainer?: ContainerSymbolId
  }) {
    this.context = context
    this.symbols = symbols
    this.diagramContainer = diagramContainer
  }

  /**
   * Grid Builder を返す（矩形行列レイアウト用）
   * @param container コンテナID。省略時は diagram 全体（DIAGRAM_CONTAINER_ID）を対象とする
   */
  grid(container?: LayoutContainerTarget): GridBuilder {
    const targetContainer = container ? toContainerSymbolId(container) : this.diagramContainer
    return new GridBuilder(this, targetContainer)
  }

  /**
   * Figure Builder を返す（非矩形レイアウト用）
   * @param container コンテナID。省略時は diagram 全体（DIAGRAM_CONTAINER_ID）を対象とする
   */
  figure(container?: LayoutContainerTarget): FigureBuilder {
    const targetContainer = container ? toContainerSymbolId(container) : this.diagramContainer
    return new FigureBuilder(this, targetContainer)
  }

  /**
   * LayoutContext を取得（Builder から参照）
   */
  getLayoutContext(): LayoutContext {
    return this.context
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
    this.context.constraints.arrangeHorizontal(this.normalizeTargets(symbolIds))
  }

  arrangeVertical(...symbolIds: LayoutTargetId[]) {
    this.context.constraints.arrangeVertical(this.normalizeTargets(symbolIds))
  }

  alignLeft(...symbolIds: LayoutTargetId[]) {
    this.context.constraints.alignLeft(this.normalizeTargets(symbolIds))
  }

  alignRight(...symbolIds: LayoutTargetId[]) {
    this.context.constraints.alignRight(this.normalizeTargets(symbolIds))
  }

  alignTop(...symbolIds: LayoutTargetId[]) {
    this.context.constraints.alignTop(this.normalizeTargets(symbolIds))
  }

  alignBottom(...symbolIds: LayoutTargetId[]) {
    this.context.constraints.alignBottom(this.normalizeTargets(symbolIds))
  }

  alignCenterX(...symbolIds: LayoutTargetId[]) {
    this.context.constraints.alignCenterX(this.normalizeTargets(symbolIds))
  }

  alignCenterY(...symbolIds: LayoutTargetId[]) {
    this.context.constraints.alignCenterY(this.normalizeTargets(symbolIds))
  }

  alignWidth(...symbolIds: LayoutTargetId[]) {
    this.context.constraints.alignWidth(this.normalizeTargets(symbolIds))
  }

  alignHeight(...symbolIds: LayoutTargetId[]) {
    this.context.constraints.alignHeight(this.normalizeTargets(symbolIds))
  }

  alignSize(...symbolIds: LayoutTargetId[]) {
    this.context.constraints.alignSize(this.normalizeTargets(symbolIds))
  }

  enclose(container: LayoutContainerTarget, childIds: LayoutTargetId[]) {
    const containerId = toContainerSymbolId(container)
    const containerSymbol = this.symbols.findById(containerId)
    if (containerSymbol) {
      const containerNestLevel = containerSymbol.nestLevel
      for (const childId of childIds) {
        const childSymbol = this.symbols.findById(toSymbolId(childId))
        if (childSymbol) {
          childSymbol.nestLevel = containerNestLevel + 1
        }
      }
    }

    this.context.constraints.enclose(containerId, this.normalizeTargets(childIds))
  }

  createGuideX(value?: number): GuideBuilderX {
    return new GuideBuilderImpl(
      this.context,
      (id: LayoutTargetId) => this.findSymbolById(id),
      "x",
      `guideX-${this.guideCounter++}`,
      value
    )
  }

  createGuideY(value?: number): GuideBuilderY {
    return new GuideBuilderImpl(
      this.context,
      (id: LayoutTargetId) => this.findSymbolById(id),
      "y",
      `guideY-${this.guideCounter++}`,
      value
    )
  }

  private normalizeTargets(targets: LayoutTargetId[]) {
    return targets.map((target) => toSymbolId(target))
  }

  private findSymbolById(id: LayoutTargetId) {
    return this.symbols.findById(toSymbolId(id))
  }
}
