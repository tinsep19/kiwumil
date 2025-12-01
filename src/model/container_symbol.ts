import type { ContainerBounds } from "../layout"
import type { SymbolBase } from "./symbol_base"
import type { ContainerSymbolId, SymbolId } from "./types"

export interface ContainerPadding {
  top: number
  right: number
  bottom: number
  left: number
}

export function toContainerSymbolId(id: SymbolId): ContainerSymbolId {
  return id as ContainerSymbolId
}

export interface ContainerSymbol extends SymbolBase {
  readonly container: ContainerBounds
}
