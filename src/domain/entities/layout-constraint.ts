import type { LayoutConstraintId } from "../../core/types"
import type { LinearConstraint } from "../../infra/solver/cassowary/types"

// ============================================================================
// Constraint Types
// ============================================================================

/**
 * ConstraintStrength: 制約の強度
 */
export type ConstraintStrength = "required" | "strong" | "medium" | "weak"

/**
 * ConstraintCategory: 制約のカテゴリ
 */
export type ConstraintCategory = "geometric" | "hint" | "symbol-internal"

// ============================================================================
// Base Interface
// ============================================================================

/**
 * BaseLayoutConstraint: すべての制約の基底インターフェース
 */
interface BaseLayoutConstraint {
  id: LayoutConstraintId
  rawConstraints: LinearConstraint[]
}

// ============================================================================
// Geometric Constraint (幾何的定義 - 常に required)
// ============================================================================

/**
 * GeometricConstraint: 幾何的な定義制約
 * 
 * - 常に `required` 強度
 * - 例: `right = x + width`, `bottom = y + height`, `enclose` の境界
 * - 幾何的に必ず満たす必要がある制約
 */
export interface GeometricConstraint extends BaseLayoutConstraint {
  category: "geometric"
  strength: "required"  // ✅ リテラル型で固定
  description?: string
}

// ============================================================================
// Layout Hint (ユーザーヒント - 柔軟な強度)
// ============================================================================

/**
 * LayoutHint: ユーザーが指定するレイアウトヒント
 * 
 * - 強度は `strong`, `medium`, `weak` のいずれか
 * - 例: `arrangeHorizontal`, `alignLeft`, `z` のデフォルト値
 * - ユーザーの意図を表現し、競合時は優先度に応じて調整可能
 */
export interface LayoutHint extends BaseLayoutConstraint {
  category: "hint"
  strength: "strong" | "medium" | "weak"  // ✅ required を除外
  hintType: "arrange" | "align" | "enclose" | "custom"
  description?: string
}

// ============================================================================
// Symbol Internal Constraint (Symbol 内部 - 柔軟な強度)
// ============================================================================

/**
 * SymbolInternalConstraint: Symbol 内部のレイアウト制約
 * 
 * - 強度は `strong`, `medium`, `weak` のいずれか
 * - 例: Actor の頭と体の位置関係、UseCase の楕円とラベルの配置
 * - Symbol の見た目を定義するが、外部制約と競合する場合は調整可能
 */
export interface SymbolInternalConstraint extends BaseLayoutConstraint {
  category: "symbol-internal"
  strength: "strong" | "medium" | "weak"  // ✅ required を除外
  symbolId: string
  description?: string
}

// ============================================================================
// Discriminated Union
// ============================================================================

/**
 * LayoutConstraint: すべての制約の Union 型
 * 
 * category フィールドで型を判別できます（Discriminated Union）
 */
export type LayoutConstraint = 
  | GeometricConstraint 
  | LayoutHint 
  | SymbolInternalConstraint

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard: GeometricConstraint かどうかを判定
 */
export function isGeometricConstraint(
  constraint: LayoutConstraint
): constraint is GeometricConstraint {
  return constraint.category === "geometric"
}

/**
 * Type guard: LayoutHint かどうかを判定
 */
export function isLayoutHint(
  constraint: LayoutConstraint
): constraint is LayoutHint {
  return constraint.category === "hint"
}

/**
 * Type guard: SymbolInternalConstraint かどうかを判定
 */
export function isSymbolInternalConstraint(
  constraint: LayoutConstraint
): constraint is SymbolInternalConstraint {
  return constraint.category === "symbol-internal"
}
