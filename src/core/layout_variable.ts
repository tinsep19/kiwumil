// src/core/layout_variable.ts
// レイアウト変数とサジェストハンドル

import type { VariableId } from "./types"

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
