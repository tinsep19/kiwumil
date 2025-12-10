import type { BoundId, LayoutBounds, ContainerBounds } from "../core"

export interface LayoutConstraintTarget {
  readonly boundId: BoundId
  readonly layout: LayoutBounds
  readonly container?: ContainerBounds
}
