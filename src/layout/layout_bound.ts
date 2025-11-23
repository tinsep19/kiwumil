import type { LayoutVar } from "./kiwi"

/**
 * LayoutBound は Layout オブジェクトの境界を表す変数のグループ
 * すべての computed properties (right, bottom, centerX, centerY) も事前に作成され制約が設定される
 */
export interface LayoutBound {
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
