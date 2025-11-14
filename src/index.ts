// src/index.ts
export { Diagram } from "./dsl/diagram"
export { DiagramBuilder } from "./dsl/diagram_builder"
export { CorePlugin } from "./plugin/core/plugin"
export { UMLPlugin } from "./plugin/uml/plugin"
export type { SymbolBase } from "./model/symbol_base"
export type { DiagramPlugin } from "./dsl/diagram_plugin"
export type { DiagramInfo } from "./model/diagram_info"

// Theme exports
export { DefaultTheme, BlueTheme, DarkTheme } from "./core/theme"
export type { Theme } from "./core/theme"
