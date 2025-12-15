// src/core/symbol.ts
// シンボル関連のインターフェース

import type { SymbolId, Point } from "./types"
import type { LayoutBounds, ContainerBounds, ItemBounds } from "./bounds"
import type { LayoutVariable } from "./layout_variable"

/**
 * ISymbol: DSL でユーザーが触れる最小限のシンボルインターフェース
 */
export interface ISymbol {
  id: SymbolId
  render(): string
  getConnectionPoint(src: Point): Point
}

/**
 * ISymbolCharacs: シンボルに付随するレイアウト情報群
 * 必須で id と layout は含む。その他の key は ContainerBounds | ItemBounds | LayoutVariable
 */
export type ISymbolCharacs = {
  id: SymbolId
  layout: LayoutBounds
  [key: string]: SymbolId | LayoutBounds | ContainerBounds | ItemBounds | LayoutVariable | undefined
}

/**
 * IContainerSymbolCharacs: container プロパティを持つシンボルの特性
 * ISymbolCharacs を拡張し、container プロパティを必須にする
 */
export interface IContainerSymbolCharacs extends ISymbolCharacs {
  container: ContainerBounds
}
