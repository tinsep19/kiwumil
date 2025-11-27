import { SymbolBase } from "../../src/model/symbol_base"
import { ContainerBounds } from "../../src/layout/layout_variables"

export interface ContainerBase extends SymbolBase {
  readonly container : ContainerBounds
}

