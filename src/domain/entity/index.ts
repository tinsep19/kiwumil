// src/domain/entity/index.ts

// Icon entity (existing)
export type { IconRef } from "./icon"

// Layout variable entity
export type {
  Variable,
  AnchorX,
  AnchorY,
  AnchorZ,
  Width,
  Height,
  Anchor,
  Dimension,
  VariableFactory,
  TopLeftAnchor,
  TopRightAnchor,
  BottomLeftAnchor,
  BottomRightAnchor,
  CornerAnchor,
} from "./layout_variable"

export {
  createBrandVariableFactory,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
} from "./layout_variable"

// Bounds entity
export type {
  Bounds,
  BoundsType,
  LayoutBounds,
  ContainerBounds,
  ItemBounds,
  TypedBounds,
  BoundsMap,
} from "./layout_variable"

export { createBoundId, getBoundsValues } from "./layout_variable"

// Item entities
export { Item, TextItem, RectItem, IconItem } from "./item"
export type {
  ItemBaseOptions,
  EstimateSize,
  TextItemOptions,
  TextAlignment,
  Padding,
  RectItemOptions,
  IconItemOptions,
} from "./item"

