import type { LayoutVar } from "./kiwi"

/**
 * LayoutType: レイアウトの種類を表す型
 * - "layout": Symbol の外矩形（Symbol は必ず1つだけ持つ）
 * - "container": Symbol を内包できる矩形
 * - "item": テキストやアイコンなど描画に必要な個別領域
 */
export type LayoutType = "layout" | "container" | "item"

/**
 * LayoutBound は Layout オブジェクトの境界を表す変数のグループ
 * すべての computed properties (right, bottom, centerX, centerY) も事前に作成され制約が設定される
 */
export interface LayoutBound {
  readonly type: LayoutType
  readonly x: LayoutVar
  readonly y: LayoutVar
  readonly width: LayoutVar
  readonly height: LayoutVar
  readonly right: LayoutVar
  readonly bottom: LayoutVar
  readonly centerX: LayoutVar
  readonly centerY: LayoutVar
}

/**
 * 型付き LayoutBound のジェネリック型
 */
export type TypeBounds<T extends LayoutType> = LayoutBound & { readonly type: T }

/**
 * 型エイリアス: Symbol の外矩形を表す LayoutBound
 */
export type LayoutBounds = TypeBounds<"layout">

/**
 * 型エイリアス: Symbol を内包できる矩形を表す LayoutBound
 */
export type ContainerBounds = TypeBounds<"container">

/**
 * 型エイリアス: 個別の描画領域を表す LayoutBound
 */
export type ItemBounds = TypeBounds<"item">

/**
 * LayoutType から対応する Bounds 型へのマッピング
 */
export type BoundsMap = {
  layout: LayoutBounds
  container: ContainerBounds
  item: ItemBounds
}

/**
 * LayoutBound から現在の座標値を取得するヘルパー関数
 */
export function getBoundsValues(bounds: LayoutBound): {
  x: number
  y: number
  width: number
  height: number
} {
  return {
    x: bounds.x.value(),
    y: bounds.y.value(),
    width: bounds.width.value(),
    height: bounds.height.value(),
  }
}
