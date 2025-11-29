// src/layout/layout_types.ts
// レイアウトシステムで使用される型定義
// 循環依存を避けるため、型のみをこのファイルに配置
import * as kiwi from "@lume/kiwi"

// ====================================
// ブランドシンボル
// ====================================

/**
 * LayoutVar 型の識別用ブランドシンボル
 * @internal
 */
const LAYOUT_VAR_BRAND = Symbol("LayoutVarBrand")

// ブランドシンボルを外部から参照可能にする（createLayoutVar で使用）
export { LAYOUT_VAR_BRAND }

// ====================================
// 型定義
// ====================================

/**
 * ブランド付き kiwi.Variable
 * Layout システム内で使用される変数型
 */
export type LayoutVar = kiwi.Variable & { readonly [LAYOUT_VAR_BRAND]: true }

// ====================================
// 型ガード関数
// ====================================

/**
 * LayoutVar 型の判定
 */
export function isLayoutVar(input: unknown): input is LayoutVar {
  return typeof input === "object" && input !== null && LAYOUT_VAR_BRAND in input
}
