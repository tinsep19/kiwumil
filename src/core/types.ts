// src/core/types.ts
// 基本的な型定義

/**
 * SymbolId: シンボルの一意識別子
 */
export type SymbolId = string

/**
 * Point: 2D座標を表す型
 */
export type Point = {
  x: number
  y: number
}

/**
 * VariableId: レイアウト変数の識別子
 */
export type VariableId = string

/**
 * BoundId: Boundsの識別子
 */
export type BoundId = string

/**
 * LayoutConstraintId: レイアウト制約の識別子
 */
export type LayoutConstraintId = string

/**
 * LinearConstraintsId: 複数の線形制約を識別するID
 */
export type LinearConstraintsId = string
