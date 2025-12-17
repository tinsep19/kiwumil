// src/core/index.ts
// 基本型
export type { SymbolId, Point, VariableId, BoundId, LayoutConstraintId, LinearConstraintsId } from "./types"

// シンボル
export type { ISymbol, ISymbolCharacs, IContainerSymbolCharacs } from "./symbol"

// レイアウト変数
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
} from "./layout_variable"
export { createBrandVariableFactory } from "./layout_variable"

// 制約
export type {
  LayoutConstraint,
  LinearConstraints,
  Term,
  LinearConstraintBuilder,
  LhsBuilder,
  OpRhsBuilder,
  StrengthBuilder,
  ConstraintSpec,
  LayoutConstraintFactory,
  LinearConstraintsFactory,
} from "./solver"

export { createLayoutConstraintFactory } from "./solver"

// レイアウトヒント
export type { HintTarget } from "./layout_hint"

// ソルバー
export type {
  CassowarySolver,
  ConstraintStrength,
  SuggestHandle,
  SuggestHandleFactory,
} from "./solver"

// 境界
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
