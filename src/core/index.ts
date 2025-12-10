// src/core/index.ts
export type {
  VariableId,
  BoundId,
  LayoutConstraintId,
  ILayoutConstraint,
  ILayoutVariable,
  SuggestHandleStrength,
  SuggestHandle,
  ISuggestHandleFactory,
  SymbolId,
  Point,
  ISymbol,
  ISymbolCharacs,
} from "./symbols"

export type {
  Bounds,
  BoundsType,
  ContainerBounds,
  ItemBounds,
  LayoutBounds,
  TypedBounds,
  BoundsMap,
} from "./bounds"

export { createBoundId, getBoundsValues } from "./bounds"

export type { Term, IConstraintsBuilder } from "./constraints_builder"
