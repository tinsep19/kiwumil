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

// ICircleSymbolCharacs は plugin/core/symbols から再エクスポート
export type { ICircleSymbolCharacs } from "../plugin/core/symbols"

// レイアウト変数
export type {
  LayoutVariable,
  ConstraintStrength,
  SuggestHandle,
  SuggestHandleFactory,
} from "./layout_variable"

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
