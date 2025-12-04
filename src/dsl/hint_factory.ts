// src/dsl/hint_factory.ts
import { ContainerSymbol, ContainerSymbolId, SymbolBase, Symbols, LayoutContext } from "../model"
import {
  FigureBuilder,
  GridBuilder,
  GuideBuilderImpl,
  type GuideBuilderX,
  type GuideBuilderY,
} from "../hint"
import {
  ContainerSymbolOrId,
  toContainerSymbolId,
  toSymbolId,
  type SymbolOrId,
} from "./symbol_helpers"
import type { LayoutConstraintTarget } from "../layout"

const DEFAULT_DIAGRAM_CONTAINER_ID = "__diagram__" as ContainerSymbolId

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
    diagramContainer = DEFAULT_DIAGRAM_CONTAINER_ID,
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
   * @param container コンテナID。省略時は diagram 全体を対象とする
   */
  grid(container?: LayoutContainerTarget): GridBuilder {
    const targetContainer = container ? toContainerSymbolId(container) : this.diagramContainer
    return new GridBuilder(this, targetContainer)
  }

  /**
   * Figure Builder を返す（非矩形レイアウト用）
   * @param container コンテナID。省略時は diagram 全体を対象とする
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
    this.context.hints.arrangeHorizontal(this.resolveConstraintTargets(symbolIds))
  }

  arrangeVertical(...symbolIds: LayoutTargetId[]) {
    this.context.hints.arrangeVertical(this.resolveConstraintTargets(symbolIds))
  }

  alignLeft(...symbolIds: LayoutTargetId[]) {
    this.context.hints.alignLeft(this.resolveConstraintTargets(symbolIds))
  }

  alignRight(...symbolIds: LayoutTargetId[]) {
    this.context.hints.alignRight(this.resolveConstraintTargets(symbolIds))
  }

  alignTop(...symbolIds: LayoutTargetId[]) {
    this.context.hints.alignTop(this.resolveConstraintTargets(symbolIds))
  }

  alignBottom(...symbolIds: LayoutTargetId[]) {
    this.context.hints.alignBottom(this.resolveConstraintTargets(symbolIds))
  }

  alignCenterX(...symbolIds: LayoutTargetId[]) {
    this.context.hints.alignCenterX(this.resolveConstraintTargets(symbolIds))
  }

  alignCenterY(...symbolIds: LayoutTargetId[]) {
    this.context.hints.alignCenterY(this.resolveConstraintTargets(symbolIds))
  }

  alignWidth(...symbolIds: LayoutTargetId[]) {
    this.context.hints.alignWidth(this.resolveConstraintTargets(symbolIds))
  }

  alignHeight(...symbolIds: LayoutTargetId[]) {
    this.context.hints.alignHeight(this.resolveConstraintTargets(symbolIds))
  }

  alignSize(...symbolIds: LayoutTargetId[]) {
    this.context.hints.alignSize(this.resolveConstraintTargets(symbolIds))
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

    const containerTarget = this.resolveConstraintTarget(containerId)
    if (!containerTarget) return
    const childTargets = this.resolveConstraintTargets(childIds)

    this.context.hints.enclose(containerTarget, childTargets)
  }

  createGuideX(value?: number): GuideBuilderX {
    return new GuideBuilderImpl(
      this.context,
      (id: LayoutTargetId) => this.findSymbolById(id),
      (id: LayoutTargetId) => this.resolveConstraintTarget(id),
      "x",
      `guideX-${this.guideCounter++}`,
      value
    )
  }

  createGuideY(value?: number): GuideBuilderY {
    return new GuideBuilderImpl(
      this.context,
      (id: LayoutTargetId) => this.findSymbolById(id),
      (id: LayoutTargetId) => this.resolveConstraintTarget(id),
      "y",
      `guideY-${this.guideCounter++}`,
      value
    )
  }

  resolveConstraintTargets(targets: LayoutTargetId[]): LayoutConstraintTarget[] {
    return targets
      .map((target) => this.resolveConstraintTarget(target))
      .filter((target): target is LayoutConstraintTarget => Boolean(target))
  }

  getConstraintTarget(target: LayoutTargetId): LayoutConstraintTarget | undefined {
    return this.resolveConstraintTarget(target)
  }

  private resolveConstraintTarget(target: LayoutTargetId): LayoutConstraintTarget | undefined {
    const symbol = this.findSymbolById(target)
    if (!symbol) return undefined
    const container = this.isContainerSymbol(symbol) ? symbol.container : undefined
    return {
      boundId: symbol.layout.boundId,
      layout: symbol.layout,
      container,
    }
  }

  private isContainerSymbol(symbol: SymbolBase): symbol is ContainerSymbol {
    return typeof (symbol as ContainerSymbol).container === "object"
  }

  private findSymbolById(id: LayoutTargetId) {
    return this.symbols.findById(toSymbolId(id))
  }
}
