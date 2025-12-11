// src/core/symbol.ts
// シンボル関連のインターフェース

import type { SymbolId, Point } from "./types"
import type { LayoutBounds, ContainerBounds, ItemBounds } from "./bounds"
import type { ILayoutVariable } from "./layout_variable"

/**
 * ISymbol: DSL でユーザーが触れる最小限のシンボルインターフェース
 */
export interface ISymbol {
  id: SymbolId
  render(): string
  getConnectionPoint(src: Point): Point
}

/**
 * EncloseZRelation: シンボル間のz軸(深さ)関係を定義
 * 例: { container: "boundary1", children: ["actor1", "actor2"], relation: "behind" }
 */
export type EncloseZRelation = {
  container: SymbolId
  children: SymbolId[]
  relation: "behind" | "front" | "same"
}

/**
 * EncloseZHint: layout.z変数への制約を定義するヒント
 * enclose処理でコンテナと子要素のz位置関係を制約として追加する際に使用
 */
export type EncloseZHint = {
  type: "enclose-z"
  relation: EncloseZRelation
}

/**
 * EncloseHint: enclose関連のヒント型のユニオン
 * 将来的に他のencloseヒントタイプを追加可能
 */
export type EncloseHint = EncloseZHint

/**
 * ISymbolCharacs: シンボルに付随するレイアウト情報群
 * 必須で id と layout は含む。その他の key は ContainerBounds | ItemBounds | ILayoutVariable
 */
export type ISymbolCharacs = {
  id: SymbolId
  layout: LayoutBounds
  encloseHints?: EncloseHint[]
  [key: string]: SymbolId | LayoutBounds | ContainerBounds | ItemBounds | ILayoutVariable | EncloseHint[] | undefined
}
