// src/core/symbols.ts
import type {
  LayoutBounds,
  ContainerBounds,
  ItemBounds,
} from "../layout"

/**
 * VariableId: レイアウト変数の識別子
 */
export type VariableId = string

/**
 * LayoutConstraintId: レイアウト制約の識別子
 */
export type LayoutConstraintId = string

/**
 * ILayoutConstraint: レイアウト制約のインターフェース
 */
export interface ILayoutConstraint {
  id: LayoutConstraintId
}

/**
 * ILayoutVariable: レイアウト変数のインターフェース
 */
export interface ILayoutVariable {
  id: VariableId
  value(): number
  variable: unknown
}

/**
 * SuggestHandleStrength: サジェストハンドルの強度
 */
export type SuggestHandleStrength = "strong" | "medium" | "weak"

/**
 * SuggestHandle: レイアウト変数への値の提案を行うハンドル
 */
export interface SuggestHandle {
  suggest(value: number): void
  strength(): SuggestHandleStrength
  dispose(): void
}

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
 * ISymbol: DSL でユーザーが触れる最小限のシンボルインターフェース
 */
export interface ISymbol {
  id: SymbolId
  render(): string
  getConnectionPoint(src: Point): Point
}

/**
 * ISymbolCharacs: シンボルに付随するレイアウト情報群
 * 必須で id と layout は含む。その他の key は ContainerBounds | ItemBounds | ILayoutVariable
 */
export type ISymbolCharacs = {
  id: SymbolId
  layout: LayoutBounds
  [key: string]: SymbolId | LayoutBounds | ContainerBounds | ItemBounds | ILayoutVariable
}
