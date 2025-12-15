import type { BoundId } from "./types"
import type { LayoutVariable } from "./layout_variable"

export function createBoundId(value: string): BoundId {
  return value
}

/**
 * Anchor types: Position anchor types for layout variables
 */
export type AnchorX = LayoutVariable
export type AnchorY = LayoutVariable
export type AnchorZ = LayoutVariable
export type Anchor = { x: AnchorX; y: AnchorY }

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
  readonly x: AnchorX
  readonly y: AnchorY
  readonly top: AnchorY // alias of y
  readonly left: AnchorX // alias of x
  readonly width: LayoutVariable
  readonly height: LayoutVariable
  readonly right: AnchorX
  readonly bottom: AnchorY
  readonly centerX: AnchorX
  readonly centerY: AnchorY
  readonly z: AnchorZ
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
  z: number
} {
  const rawX = bounds.x.value()
  const rawY = bounds.y.value()
  const rawWidth = bounds.width.value()
  const rawHeight = bounds.height.value()
  const rawRight = bounds.right.value()
  const rawBottom = bounds.bottom.value()
  const rawCenterX = bounds.centerX.value()
  const rawCenterY = bounds.centerY.value()
  const rawZ = bounds.z.value()

  // NaN や Infinity を検出してログ出力
  const hasInvalidValues =
    !Number.isFinite(rawX) ||
    !Number.isFinite(rawY) ||
    !Number.isFinite(rawWidth) ||
    !Number.isFinite(rawHeight) ||
    !Number.isFinite(rawRight) ||
    !Number.isFinite(rawBottom) ||
    !Number.isFinite(rawCenterX) ||
    !Number.isFinite(rawCenterY) ||
    !Number.isFinite(rawZ)

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
        z: rawZ,
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
    z: rawZ,
  }
}
