export { TypeDiagram } from "./diagram_builder"
export { HintFactory } from "./hint_factory"
export { NamespaceBuilder } from "./namespace_builder"
export { SymbolRegistry } from "../model"
export type { DiagramPlugin } from "./diagram_plugin"
export type {
  BuildElementNamespace,
  BuildRelationshipNamespace,
  BuildIconNamespace,
  PluginIcons,
} from "./namespace_types"
export { isRectMatrix } from "./matrix_utils"
export type { Matrix, IsRectMatrix } from "./matrix_utils"
export { toSymbolId } from "./symbol_helpers"
export {
  createArrangeHorizontalSpec,
  createArrangeVerticalSpec,
  createAlignLeftSpec,
  createAlignRightSpec,
  createAlignTopSpec,
  createAlignBottomSpec,
  createAlignCenterXSpec,
  createAlignCenterYSpec,
  createAlignWidthSpec,
  createAlignHeightSpec,
  createEncloseSpec,
} from "./hint_builder_helpers"
