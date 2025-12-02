export { TypeDiagram } from "./diagram_builder"
export { HintFactory } from "./hint_factory"
export { NamespaceBuilder } from "./namespace_builder"
export { Symbols } from "../model"
export { Relationships } from "./relationships"
export type { DiagramPlugin } from "./diagram_plugin"
export type {
  BuildElementNamespace,
  BuildRelationshipNamespace,
  BuildIconNamespace,
  PluginIcons,
} from "./namespace_types"
export { isRectMatrix } from "./matrix_utils"
export type { Matrix, IsRectMatrix } from "./matrix_utils"
export { toSymbolId, toContainerSymbolId } from "./symbol_helpers"
export type { SymbolOrId, ContainerSymbolOrId } from "./symbol_helpers"
