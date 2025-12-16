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
 * Anchor types: Position anchor types for layout variables (branded for type safety)
 */
export type AnchorX = Variable & { readonly __brand_anchorX: "anchor_x" }
export type AnchorY = Variable & { readonly __brand_anchorY: "anchor_y" }
export type AnchorZ = Variable & { readonly __brand_anchorZ: "anchor_z" }
export type Anchor = { x: AnchorX; y: AnchorY }

/**
 * Dimension types: Size dimension types for layout variables (branded for type safety)
 */
export type Width = Variable & { readonly __brand_width: "width" }
export type Height = Variable & { readonly __brand_height: "height" }
export type Dimension = { width: Width; height: Height }

/**
 * Cast functions to convert Variable to branded types
 * These functions provide type-level branding without runtime overhead
 */
export function asAnchorX(v: Variable): AnchorX {
  return v as AnchorX
}

export function asAnchorY(v: Variable): AnchorY {
  return v as AnchorY
}

export function asAnchorZ(v: Variable): AnchorZ {
  return v as AnchorZ
}

export function asWidth(v: Variable): Width {
  return v as Width
}

export function asHeight(v: Variable): Height {
  return v as Height
}

/**
 * VariableFactory: Factory function type for creating Variables
 */
export type VariableFactory = (id: VariableId) => Variable

/**
 * Branded variable factory creator
 * Creates a factory that produces branded layout variables
 */
export function createBrandVariableFactory(factory: VariableFactory) {
  return {
    createAnchorX(id: VariableId): AnchorX {
      return asAnchorX(factory(id))
    },
    createAnchorY(id: VariableId): AnchorY {
      return asAnchorY(factory(id))
    },
    createAnchorZ(id: VariableId): AnchorZ {
      return asAnchorZ(factory(id))
    },
    createWidth(id: VariableId): Width {
      return asWidth(factory(id))
    },
    createHeight(id: VariableId): Height {
      return asHeight(factory(id))
    },
    createVariable(id: VariableId): Variable {
      return factory(id)
    },
  }
}
