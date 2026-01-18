// src/domain/ports/symbol.ts
// シンボルのインターフェース定義

import type { SymbolId, Point, LayoutBounds } from "../../core"

/**
 * ISymbol: 図の要素が実装すべきインターフェース
 * プラグインから提供される実体
 */
export interface ISymbol<T extends object = {}> {
  id: SymbolId
  characs: ISymbolCharacs<T>
  render(): RenderModel
  getConnectionPoint(src: Point): Point
}

/* 普段の使い方
 * hint.anchor(symbol).at(container.topLeft())
 * hint.anchor(symbol.characs.icon).at(container.center())
 *
 * 今後考えていること
 * hint.relayout(symbol, (hint, characs) => {
 *   const { icon, label, ellipse, container, bounds } = characs
 *   // シンボル内の既定の配置を変更できる
 * })
 * // symbolの語彙から別のシンボルや関連の作成
 * const {rel: rel1, sym: sym1 } = symbol.createChild({ })
 *
 */

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
