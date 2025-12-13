// src/core/layout_variable.ts
// レイアウト変数とサジェストハンドル

import type { VariableId } from "./types"

/**
 * LayoutVariable: レイアウト変数のインターフェース
 */
export interface LayoutVariable {
  id: VariableId
  value(): number
  variable: unknown
}

/**
 * ConstraintStrength: 制約の強度
 */
export type ConstraintStrength = "required" | "strong" | "medium" | "weak"

/**
 * SuggestHandle: レイアウト変数への値の提案を行うハンドル
 */
export interface SuggestHandle {
  suggest(value: number): void
  strength(): ConstraintStrength
  dispose(): void
}

/**
 * SuggestHandleFactory: SuggestHandleを作成するファクトリインターフェース
 */
export interface SuggestHandleFactory {
  strong(): SuggestHandle
  medium(): SuggestHandle
  weak(): SuggestHandle
}
