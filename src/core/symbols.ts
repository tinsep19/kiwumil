// src/core/symbols.ts
import type {
  LayoutBounds,
  ContainerBounds,
  ItemBounds,
} from "./bounds"

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
 * ConstraintStrength: 制約の強度
 */
export type ConstraintStrength = "required" | "strong" | "medium" | "weak"

/**
 * ISuggestHandle: レイアウト変数への値の提案を行うハンドル
 */
export interface ISuggestHandle {
  suggest(value: number): void
  strength(): ConstraintStrength
  dispose(): void
}

/**
 * ISuggestHandleFactory: ISuggestHandleを作成するファクトリインターフェース
 */
export interface ISuggestHandleFactory {
  strong(): ISuggestHandle
  medium(): ISuggestHandle
  weak(): ISuggestHandle
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
