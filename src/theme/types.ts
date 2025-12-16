// src/theme/types.ts

// SymbolName は string 型（プラグインで拡張可能）
export type SymbolName = string

export interface StyleSet {
  textColor: string
  fontSize: number
  fontFamily: string
  strokeWidth: number
  strokeColor: string
  fillColor: string
  backgroundColor?: string
  horizontalGap: number
  verticalGap: number
}

export interface Theme {
  name: string
  defaultStyleSet: StyleSet
  symbols?: Record<SymbolName, Partial<StyleSet>>
}

export interface ContainerPadding {
  top: number
  right: number
  bottom: number
  left: number
}
