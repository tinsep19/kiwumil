// src/dsl/hint_factory.ts
import type { SymbolBase } from "../model/symbol_base"

export interface LayoutHint {
  type: "horizontal" | "vertical"
  symbols: SymbolBase[]
  gap?: number
}

export class HintFactory {
  constructor(private hints: LayoutHint[]) {}

  horizontal(...symbols: SymbolBase[]) {
    this.hints.push({
      type: "horizontal",
      symbols,
      gap: 80
    })
  }

  vertical(...symbols: SymbolBase[]) {
    this.hints.push({
      type: "vertical",
      symbols,
      gap: 50
    })
  }
}
