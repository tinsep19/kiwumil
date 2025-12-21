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
 * ForbiddenKeys: ISymbolCharacs の基本フィールドとして予約されているキー
 */
type ForbiddenKeys = "id" | "bounds"

/**
 * NoBaseOverlap: 型 T が ForbiddenKeys のいずれかを含む場合は never を返す
 * これにより、拡張型が基本フィールドを上書きすることを防ぐ
 */
type NoBaseOverlap<T> = Extract<keyof T, ForbiddenKeys> extends never ? T : never

/**
 * IExtraCharacs: 拡張可能な特性を表す型
 * ForbiddenKeys と重複しない型のみを受け入れる
 */
type IExtraCharacs<T> = NoBaseOverlap<T>

/**
 * ISymbolCharacs: シンボルに付随するレイアウト情報群
 * 必須で id と bounds は含む。
 * ジェネリック型パラメータ T により、拡張フィールドを型安全に追加できる
 * T には id と bounds 以外のフィールドのみを含める必要がある
 */
export type ISymbolCharacs<T extends object = {}> = {
  id: SymbolId
  bounds: LayoutBounds
} & IExtraCharacs<T>

/**
 * IContainerSymbolCharacs: container プロパティを持つシンボルの特性
 * ISymbolCharacs を拡張し、container プロパティを必須にする
 */
export type IContainerSymbolCharacs = ISymbolCharacs<{ container: ContainerBounds }>
