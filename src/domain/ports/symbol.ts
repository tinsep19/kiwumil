// src/domain/ports/symbol.ts
// シンボルのインターフェース定義

import type { SymbolId, Point, LayoutBounds } from "../../core"

/**
 * ISymbol: 図の要素が実装すべきインターフェース
 * プラグインから提供される実体
 */
export interface ISymbol {
  id: SymbolId
  bounds: LayoutBounds
  render(): string
  getConnectionPoint(src: Point): Point
}

/**
 * ISymbolCharacs: シンボルに付随するレイアウト情報
 * 必須で id と bounds を含み、拡張フィールドを型安全に追加可能
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ISymbolCharacs<T extends object = {}> = {
  id: SymbolId
  bounds: LayoutBounds
} & T

/**
 * RenderModel: レンダリング用のモデル
 * （将来的に詳細化する可能性あり）
 */
export type RenderModel = string
