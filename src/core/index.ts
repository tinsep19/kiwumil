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
} from "./symbol"

// レイアウト変数
export type {
  ILayoutVariable,
  ConstraintStrength,
  ISuggestHandle,
  ISuggestHandleFactory,
} from "./layout_variable"

// 制約
export type {
  ILayoutConstraint,
  Term,
  IConstraintsBuilder,
  ConstraintSpec,
  HintTarget,
} from "./constraint"

// ソルバー
export type { ILayoutSolver } from "./solver"

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
