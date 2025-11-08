// src/dsl/hint_factory.ts
import type { SymbolId } from "../model/types"

export interface LayoutHint {
  type: "horizontal" | "vertical"
  symbolIds: SymbolId[]
  gap?: number
}

export class HintFactory {
  constructor(private hints: LayoutHint[]) {}

  horizontal(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "horizontal",
      symbolIds,
      gap: 80
    })
  }

  vertical(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "vertical",
      symbolIds,
      gap: 50
    })
  }
}
