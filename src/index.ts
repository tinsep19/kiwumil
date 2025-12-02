// メインエントリポイント
export { TypeDiagram, Symbols, Relationships } from "./dsl"

// プラグイン
export { CorePlugin, UMLPlugin } from "./plugin"
export type { TextInfo } from "./plugin"

// 型定義
export type { DiagramPlugin } from "./dsl"
export type { DiagramInfo, SymbolBase } from "./model"
export type { SymbolId, ContainerSymbolId, RelationshipId } from "./model"
export { toContainerSymbolId } from "./model"

// Layout 型定義
export type {
  Bounds,
  BoundsType,
  LayoutContext,
  LayoutConstraintType,
} from "./layout"
export { LayoutConstraintStrength } from "./layout"

// テーマ
export { DefaultTheme, BlueTheme, DarkTheme } from "./theme"
export type { Theme } from "./theme"
