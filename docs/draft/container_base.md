import { SymbolBase } from "../../src/model/symbol_base"
import { ContainerBounds } from "../../src/kiwi/layout_variables"

export interface ContainerBase extends SymbolBase {
  readonly container : ContainerBounds
}

