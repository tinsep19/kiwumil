// src/core/index.ts
export type {
  VariableId,
  BoundId,
  LayoutConstraintId,
  ILayoutConstraint,
  ILayoutVariable,
  ConstraintStrength,
  ISuggestHandle,
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

export type { Term, IConstraintsBuilder, ConstraintSpec } from "./constraints_builder"

export type { HintTarget } from "./hint_target"

export type { ILayoutSolver } from "./layout_solver"
