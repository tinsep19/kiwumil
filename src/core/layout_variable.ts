// src/core/layout_variable.ts
// レイアウト変数とサジェストハンドル（Variable のみ：SuggestHandle 関連の型は solver に移動）

import type { VariableId } from "./types"

/**
 * Variable: レイアウト変数のインターフェース
 */
export interface Variable {
  id: VariableId
  value(): number
  variable: unknown
}

/**
 * Anchor types: Position anchor types for layout variables
 */
export type AnchorX = Variable
export type AnchorY = Variable
export type AnchorZ = Variable
export type Anchor = { x: AnchorX; y: AnchorY }

/**
 * Dimension types: Size dimension types for layout variables
 */
export type Width = Variable
export type Height = Variable
export type Dimension = { width: Width; height: Height }
