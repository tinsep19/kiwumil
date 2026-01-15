import type { VariableId } from "../../core"
import type { FreeVariable } from "../../infra/solver/cassowary"

// ============================================================================
// Variable Type Classification (Discriminated Union)
// ============================================================================

/**
 * VariableType: 変数の種類を表す discriminator
 */
export type VariableType = 
  | "anchor_x" 
  | "anchor_y" 
  | "anchor_z" 
  | "width" 
  | "height" 
  | "generic"

// ============================================================================
// Base Variable Interface
// ============================================================================

/**
 * BaseVariable: すべての変数の基底インターフェース
 */
export interface BaseVariable {
  id: VariableId
  freeVariable: FreeVariable
  variableType: VariableType  // ✅ discriminator（実行時に存在）
  value(): number
  name(): string
}

// ============================================================================
// Typed Variables (Discriminated Union)
// ============================================================================

/**
 * AnchorX: X軸アンカー変数
 */
export interface AnchorX extends BaseVariable {
  variableType: "anchor_x"
}

/**
 * AnchorY: Y軸アンカー変数
 */
export interface AnchorY extends BaseVariable {
  variableType: "anchor_y"
}

/**
 * AnchorZ: Z軸アンカー変数（深度）
 */
export interface AnchorZ extends BaseVariable {
  variableType: "anchor_z"
}

/**
 * Width: 幅変数
 */
export interface Width extends BaseVariable {
  variableType: "width"
}

/**
 * Height: 高さ変数
 */
export interface Height extends BaseVariable {
  variableType: "height"
}

/**
 * GenericVariable: 汎用変数（型指定なし）
 */
export interface GenericVariable extends BaseVariable {
  variableType: "generic"
}

// ============================================================================
// Union Type
// ============================================================================

/**
 * Variable: すべての変数の Union 型
 * 
 * variableType フィールドで型を判別できます（Discriminated Union）
 */
export type Variable = 
  | AnchorX 
  | AnchorY 
  | AnchorZ 
  | Width 
  | Height 
  | GenericVariable

// ============================================================================
// Type Guards
// ============================================================================

export function isAnchorX(v: Variable): v is AnchorX {
  return v.variableType === "anchor_x"
}

export function isAnchorY(v: Variable): v is AnchorY {
  return v.variableType === "anchor_y"
}

export function isAnchorZ(v: Variable): v is AnchorZ {
  return v.variableType === "anchor_z"
}

export function isWidth(v: Variable): v is Width {
  return v.variableType === "width"
}

export function isHeight(v: Variable): v is Height {
  return v.variableType === "height"
}

export function isGenericVariable(v: Variable): v is GenericVariable {
  return v.variableType === "generic"
}

// ============================================================================
// Implementation
// ============================================================================

/**
 * VariableImpl: Variable の実装クラス
 */
export class VariableImpl implements BaseVariable {
  constructor(
    public readonly id: VariableId,
    public readonly freeVariable: FreeVariable,
    public readonly variableType: VariableType
  ) {}

  value(): number {
    return this.freeVariable.value()
  }

  name(): string {
    return this.freeVariable.name()
  }
}

// ============================================================================
// Convenience Types
// ============================================================================

/**
 * Anchor: X, Y アンカーのペア
 */
export type Anchor = {
  x: AnchorX
  y: AnchorY
}

/**
 * Dimension: 幅、高さのペア
 */
export type Dimension = {
  width: Width
  height: Height
}

/**
 * Corner Anchors: 4隅のアンカー
 */
export type TopLeftAnchor = Anchor & { readonly corner: "topLeft" }
export type TopRightAnchor = Anchor & { readonly corner: "topRight" }
export type BottomLeftAnchor = Anchor & { readonly corner: "bottomLeft" }
export type BottomRightAnchor = Anchor & { readonly corner: "bottomRight" }

export type CornerAnchor =
  | TopLeftAnchor
  | TopRightAnchor
  | BottomLeftAnchor
  | BottomRightAnchor

// Helper functions
export function topLeft(anchor: Anchor): TopLeftAnchor {
  return { ...anchor, corner: "topLeft" }
}

export function topRight(anchor: Anchor): TopRightAnchor {
  return { ...anchor, corner: "topRight" }
}

export function bottomLeft(anchor: Anchor): BottomLeftAnchor {
  return { ...anchor, corner: "bottomLeft" }
}

export function bottomRight(anchor: Anchor): BottomRightAnchor {
  return { ...anchor, corner: "bottomRight" }
}
