// メインエントリポイント
export { TypeDiagram } from "./dsl/diagram_builder"

// プラグイン
export { CorePlugin } from "./plugin/core/plugin"
export { UMLPlugin } from "./plugin/uml/plugin"
export type { TextInfo } from "./plugin/core/symbols/text_symbol"

export { Symbols } from "./dsl/symbols"
export { Relationships } from "./dsl/relationships"
// 型定義
export type { DiagramPlugin } from "./dsl/diagram_plugin"
export type { DiagramInfo } from "./model/diagram_info"
export type { Theme } from "./theme"
export type { SymbolBase } from "./model/symbol_base"
export type { SymbolId, ContainerSymbolId, RelationshipId } from "./model/types"
export { toContainerSymbolId } from "./model/container_symbol_base"
export { DIAGRAM_CONTAINER_ID } from "./model/types"

// Layout 型定義
export type { LayoutContext } from "./layout/layout_context"
export type { LayoutConstraintType } from "./layout/layout_constraints"
export { LayoutConstraintStrength } from "./layout/layout_variables"

// 新しい型名
export type { Bounds, BoundsType } from "./layout/layout_bound"

// 後方互換性のための deprecated 型エイリアス
/**
 * @deprecated Use Bounds instead
 */
export type { LayoutBound } from "./layout/layout_bound"

/**
 * @deprecated Use BoundsType instead
 */
export type { LayoutType } from "./layout/layout_bound"

// テーマ
export { DefaultTheme, BlueTheme, DarkTheme } from "./theme"
