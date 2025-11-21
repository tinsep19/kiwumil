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
