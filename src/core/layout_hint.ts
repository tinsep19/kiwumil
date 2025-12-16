// src/core/layout_hint.ts
// HintTarget interface definition

import type { BoundId } from "./types"
import type { LayoutBounds, ContainerBounds } from "./bounds"

/**
 * HintTarget: 制約適用の対象となるシンボルの境界情報
 */
export interface HintTarget {
  readonly boundId: BoundId
  readonly bounds: LayoutBounds
  readonly container?: ContainerBounds
}
