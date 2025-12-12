import type { ContainerBounds } from "../core"
import type { SymbolBase } from "./symbol_base"

export interface ContainerPadding {
  top: number
  right: number
  bottom: number
  left: number
}

export interface ContainerSymbol extends SymbolBase {
  readonly container: ContainerBounds
}
