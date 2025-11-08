// src/model/symbol_base.ts
import type { SymbolId, Bounds } from "./types"

export abstract class SymbolBase {
  readonly id: SymbolId
  readonly label: string
  bounds?: Bounds

  constructor(id: SymbolId, label: string) {
    this.id = id
    this.label = label
  }

  abstract getDefaultSize(): { width: number; height: number }

  abstract toSVG(): string
}
