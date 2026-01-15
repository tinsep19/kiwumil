// src/core/index.ts
// 基本型
export type { SymbolId, Point, VariableId, BoundId, LayoutConstraintId } from "./types"

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
  TopLeftAnchor,
  TopRightAnchor,
  BottomLeftAnchor,
  BottomRightAnchor,
  CornerAnchor,
} from "./layout_variable"
export { createBrandVariableFactory, topLeft, topRight, bottomLeft, bottomRight } from "./layout_variable"

// 制約
export type {
  LayoutConstraint,
  Term,
  LinearConstraintBuilder,
  LhsBuilder,
  OpRhsBuilder,
  StrengthBuilder,
  ConstraintSpec,
} from "./solver"

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
  BoundsMap,
} from "./layout_variable"

export { createBoundId, getBoundsValues } from "./layout_variable"

// DI Container
export { DiContainer } from "./di-container"
export { createDiContainer } from "./create-di-container"
export { SERVICE_TOKENS } from "./service-tokens"
export type { ServiceToken } from "./service-tokens"

// LayoutContext
export { LayoutContext } from "./layout_context"
export { createLayoutContext } from "./create-layout-context"
