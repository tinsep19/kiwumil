// メインエントリポイント
export { TypeDiagram } from "./presentation"
export { SymbolRegistry, RelationshipRegistry } from "./model"

// プラグイン
export { CorePlugin, UMLPlugin } from "./plugin"
export type { TextInfo } from "./plugin"

// 型定義
export type { DiagramPlugin } from "./dsl"
export type { DiagramInfo, ISymbol, LayoutContext } from "./model"
export type { SymbolId, RelationshipId } from "./model"

// Layout 型定義
export type { Bounds, BoundsType } from "./core"

// テーマ
export { DefaultTheme, BlueTheme, DarkTheme } from "./theme"
export type { Theme } from "./theme"

// Item システム
export { Item, TextItem, RectItem, IconItem } from "./item"
export type {
  ItemBaseOptions,
  EstimateSize,
  TextItemOptions,
  TextAlignment,
  Padding,
  RectItemOptions,
  IconItemOptions,
} from "./item"
