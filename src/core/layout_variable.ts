// Re-export from domain entity for backward compatibility
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
  BoundsType,
  Bounds,
  TypedBounds,
  LayoutBounds,
  ContainerBounds,
  ItemBounds,
  BoundsMap,
} from "../domain/entity/layout_variable"

export {
  createBrandVariableFactory,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  createBoundId,
  getBoundsValues,
} from "../domain/entity/layout_variable"
