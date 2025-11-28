import type { BoundId, LayoutBounds, ContainerBounds } from "./bounds"

export interface LayoutConstraintTarget {
  readonly boundId: BoundId
  readonly layout: LayoutBounds
  readonly container?: ContainerBounds
}
