// src/core/symbol.ts
// シンボル関連のインターフェース

import type { SymbolId, Point } from "./types"
import type { LayoutBounds, ContainerBounds, ItemBounds } from "./bounds"
import type { Variable } from "./layout_variable"

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
 * 必須で id と bounds は含む。その他の key は ContainerBounds | ItemBounds | Variable
 */
export type ISymbolCharacs = {
  id: SymbolId
  bounds: LayoutBounds
  [key: string]: SymbolId | LayoutBounds | ContainerBounds | ItemBounds | Variable | undefined
}

/**
 * IContainerSymbolCharacs: container プロパティを持つシンボルの特性
 * ISymbolCharacs を拡張し、container プロパティを必須にする
 */
export interface IContainerSymbolCharacs extends ISymbolCharacs {
  container: ContainerBounds
}
