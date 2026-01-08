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
 * Unique symbol for branding layout variable types
 * @internal
 */
declare const __brand: unique symbol

/**
 * Anchor types: Position anchor types for layout variables (branded for type safety)
 */
export type AnchorX = Variable & { readonly [__brand]: "anchor_x" }
export type AnchorY = Variable & { readonly [__brand]: "anchor_y" }
export type AnchorZ = Variable & { readonly [__brand]: "anchor_z" }
export type Anchor = { x: AnchorX; y: AnchorY }

// Extended anchor types for specific corners (with branding for type safety)
export type TopLeftAnchor = Anchor & { readonly corner: "topLeft" }
export type TopRightAnchor = Anchor & { readonly corner: "topRight" }
export type BottomLeftAnchor = Anchor & { readonly corner: "bottomLeft" }
export type BottomRightAnchor = Anchor & { readonly corner: "bottomRight" }

/**
 * Dimension types: Size dimension types for layout variables (branded for type safety)
 */
export type Width = Variable & { readonly [__brand]: "width" }
export type Height = Variable & { readonly [__brand]: "height" }
export type Dimension = { width: Width; height: Height }

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
      return factory(id) as AnchorX
    },
    createAnchorY(id: VariableId): AnchorY {
      return factory(id) as AnchorY
    },
    createAnchorZ(id: VariableId): AnchorZ {
      return factory(id) as AnchorZ
    },
    createWidth(id: VariableId): Width {
      return factory(id) as Width
    },
    createHeight(id: VariableId): Height {
      return factory(id) as Height
    },
    createVariable(id: VariableId): Variable {
      return factory(id)
    },
  }
}

/**
 * Utility functions for creating specific anchor corner types
 */
export function topLeft(anchor: Anchor): TopLeftAnchor {
  return {
    ...anchor,
    corner: "topLeft",
  }
}

export function topRight(anchor: Anchor): TopRightAnchor {
  return {
    ...anchor,
    corner: "topRight",
  }
}

export function bottomLeft(anchor: Anchor): BottomLeftAnchor {
  return {
    ...anchor,
    corner: "bottomLeft",
  }
}

export function bottomRight(anchor: Anchor): BottomRightAnchor {
  return {
    ...anchor,
    corner: "bottomRight",
  }
}
