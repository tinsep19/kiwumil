import type { ILayoutVariable } from "./symbols"
import type { BoundId } from "./symbols"

export function createBoundId(value: string): BoundId {
  return value
}

/**
 * BoundsType: レイアウトの種類を表す型
 * - "layout": Symbol の外矩形（Symbol は必ず1つだけ持つ）
 * - "container": Symbol を内包できる矩形
 * - "item": テキストやアイコンなど描画に必要な個別領域
 */
export type BoundsType = "layout" | "container" | "item"

/**
 * Bounds は Layout オブジェクトの境界を表す変数のグループ
 * すべての computed properties (right, bottom, centerX, centerY) も事前に作成され制約が設定される
 */
export interface Bounds {
  readonly boundId: BoundId
  readonly type: BoundsType
  readonly x: ILayoutVariable
  readonly y: ILayoutVariable
  readonly width: ILayoutVariable
  readonly height: ILayoutVariable
  readonly right: ILayoutVariable
  readonly bottom: ILayoutVariable
  readonly centerX: ILayoutVariable
  readonly centerY: ILayoutVariable
}

/**
 * 型付き Bounds のジェネリック型
 * Bounds の type プロパティを特定のリテラル型に絞り込む
 */
export type TypedBounds<T extends BoundsType> = Bounds & { readonly type: T }

/**
 * 型エイリアス: Symbol の外矩形を表す Bounds
 */
export type LayoutBounds = TypedBounds<"layout">

/**
 * 型エイリアス: Symbol を内包できる矩形を表す Bounds
 */
export type ContainerBounds = TypedBounds<"container">

/**
 * 型エイリアス: 個別の描画領域を表す Bounds
 */
export type ItemBounds = TypedBounds<"item">

/**
 * BoundsType から対応する Bounds 型へのマッピング
 */
export type BoundsMap = {
  layout: LayoutBounds
  container: ContainerBounds
  item: ItemBounds
}

/**
 * Bounds から現在の座標値を取得するヘルパー関数
 * 不正な値（NaN、Infinity）を検出して警告を出す
 */
export function getBoundsValues(bounds: Bounds): {
  x: number
  y: number
  width: number
  height: number
  right: number
  bottom: number
  centerX: number
  centerY: number
} {
  const rawX = bounds.x.value()
  const rawY = bounds.y.value()
  const rawWidth = bounds.width.value()
  const rawHeight = bounds.height.value()
  const rawRight = bounds.right.value()
  const rawBottom = bounds.bottom.value()
  const rawCenterX = bounds.centerX.value()
  const rawCenterY = bounds.centerY.value()

  // NaN や Infinity を検出してログ出力
  const hasInvalidValues =
    !Number.isFinite(rawX) ||
    !Number.isFinite(rawY) ||
    !Number.isFinite(rawWidth) ||
    !Number.isFinite(rawHeight) ||
    !Number.isFinite(rawRight) ||
    !Number.isFinite(rawBottom) ||
    !Number.isFinite(rawCenterX) ||
    !Number.isFinite(rawCenterY)

  if (hasInvalidValues) {
    console.warn(
      `[getBoundsValues] Invalid bounds detected:`,
      {
        x: rawX,
        y: rawY,
        width: rawWidth,
        height: rawHeight,
        right: rawRight,
        bottom: rawBottom,
        centerX: rawCenterX,
        centerY: rawCenterY,
      }
    )
  }

  // 負の値を検出して警告（レイアウトソルバの問題を示唆）
  if (rawWidth < 0) {
    console.warn(`[getBoundsValues] Negative width detected: ${rawWidth}`)
  }
  if (rawHeight < 0) {
    console.warn(`[getBoundsValues] Negative height detected: ${rawHeight}`)
  }

  // 値はそのまま返す（レイアウト計算への影響を最小化）
  // 描画時に各シンボルで安全な値にクランプする
  return {
    x: rawX,
    y: rawY,
    width: rawWidth,
    height: rawHeight,
    right: rawRight,
    bottom: rawBottom,
    centerX: rawCenterX,
    centerY: rawCenterY,
  }
}
