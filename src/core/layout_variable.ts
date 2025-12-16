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
