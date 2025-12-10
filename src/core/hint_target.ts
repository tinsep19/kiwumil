import type { BoundId } from "./symbols"
import type { LayoutBounds, ContainerBounds } from "./bounds"

export interface HintTarget {
  readonly boundId: BoundId
  readonly layout: LayoutBounds
  readonly container?: ContainerBounds
}
