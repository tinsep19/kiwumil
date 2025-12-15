// src/dsl/hint_factory.ts
import { ContainerSymbol, SymbolBase, Symbols, LayoutContext } from "../model"
import type { SymbolId, HintTarget } from "../core"
import {
  FigureBuilder,
  GridBuilder,
  GuideBuilderImpl,
  type GuideBuilderX,
  type GuideBuilderY,
} from "../hint"
import {
  ContainerSymbolOrId,
  toSymbolId,
  type SymbolOrId,
} from "./symbol_helpers"

type LayoutTargetId = SymbolOrId
type LayoutContainerTarget = ContainerSymbolOrId

export class HintFactory {
  private guideCounter = 0
  private diagramContainer: SymbolId

  private readonly context: LayoutContext
  private readonly symbols: Symbols

  constructor({
    context,
    symbols,
    diagramContainer,
  }: {
    context: LayoutContext
    symbols: Symbols
    diagramContainer: SymbolId
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
    const targetContainer = container ? toSymbolId(container) : this.diagramContainer
    return new GridBuilder(this, targetContainer)
  }

  /**
   * Figure Builder を返す（非矩形レイアウト用）
   * @param container コンテナID。省略時は diagram 全体を対象とする
   */
  figure(container?: LayoutContainerTarget): FigureBuilder {
    const targetContainer = container ? toSymbolId(container) : this.diagramContainer
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
    return this.symbols.getAllSymbols()
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
    const containerId = toSymbolId(container)
    // Note: nestLevel mutations removed. Depth handling now done via layout.z constraints
    // which should be set by hints.enclose() implementation with z-based constraints.
    // TODO: Verify that hints.enclose() adds proper z constraints for container/child relationships

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

  resolveConstraintTargets(targets: LayoutTargetId[]): HintTarget[] {
    return targets
      .map((target) => this.resolveConstraintTarget(target))
      .filter((target): target is HintTarget => Boolean(target))
  }

  getConstraintTarget(target: LayoutTargetId): HintTarget | undefined {
    return this.resolveConstraintTarget(target)
  }

  private resolveConstraintTarget(target: LayoutTargetId): HintTarget | undefined {
    const symbol = this.findSymbolById(target)
    if (!symbol) return undefined
    const container = this.isContainerSymbol(symbol) ? symbol.container : undefined
    return {
      boundId: symbol.bounds.boundId,
      bounds: symbol.bounds,
      container,
    }
  }

  private isContainerSymbol(symbol: SymbolBase): symbol is ContainerSymbol {
    return typeof (symbol as ContainerSymbol).container === "object"
  }

  private findSymbolById(id: LayoutTargetId) {
    return this.symbols.findSymbolById(toSymbolId(id))
  }
}
