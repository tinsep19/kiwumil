// src/core/index.ts
// 基本型
export type {
  SymbolId,
  Point,
  VariableId,
  BoundId,
  LayoutConstraintId,
} from "./types"

// シンボル
export type {
  ISymbol,
  ISymbolCharacs,
  IContainerSymbolCharacs,
} from "./symbol"

// レイアウト変数
export type { Variable } from "./layout_variable"

// 制約
export type {
  LayoutConstraint,
  Term,
  LinearConstraintBuilder,
  LhsBuilder,
  OpRhsBuilder,
  StrengthBuilder,
  ConstraintSpec,
  HintTarget,
} from "./constraint"

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
  AnchorX,
  AnchorY,
  AnchorZ,
  Anchor,
  Width,
  Height,
  Dimension,
} from "./bounds"

export { createBoundId, getBoundsValues } from "./bounds"
