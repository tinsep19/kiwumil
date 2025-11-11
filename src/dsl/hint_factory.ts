// src/dsl/hint_factory.ts
import type { SymbolId } from "../model/types"
import type { SymbolBase } from "../model/symbol_base"
import type { Theme } from "../core/theme"

export interface LayoutHint {
  type: 
    | "horizontal"           // deprecated: use arrangeHorizontal
    | "vertical"             // deprecated: use arrangeVertical
    | "arrangeHorizontal"
    | "arrangeVertical"
    | "alignLeft"
    | "alignRight"
    | "alignTop"
    | "alignBottom"
    | "alignCenterX"
    | "alignCenterY"
    | "alignWidth"
    | "alignHeight"
    | "alignSize"
    | "enclose"
  symbolIds: SymbolId[]
  gap?: number
  containerId?: SymbolId
  childIds?: SymbolId[]
}

export class HintFactory {
  constructor(
    private hints: LayoutHint[],
    private symbols: SymbolBase[],
    private theme: Theme
  ) {}

  horizontal(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "horizontal",
      symbolIds,
      gap: this.theme.defaultStyleSet.horizontalGap
    })
  }

  vertical(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "vertical",
      symbolIds,
      gap: this.theme.defaultStyleSet.verticalGap
    })
  }

  // New Arrange methods
  arrangeHorizontal(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "arrangeHorizontal",
      symbolIds,
      gap: this.theme.defaultStyleSet.horizontalGap
    })
  }

  arrangeVertical(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "arrangeVertical",
      symbolIds,
      gap: this.theme.defaultStyleSet.verticalGap
    })
  }

  // New Align methods
  alignLeft(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignLeft",
      symbolIds
    })
  }

  alignRight(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignRight",
      symbolIds
    })
  }

  alignTop(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignTop",
      symbolIds
    })
  }

  alignBottom(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignBottom",
      symbolIds
    })
  }

  alignCenterX(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignCenterX",
      symbolIds
    })
  }

  alignCenterY(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignCenterY",
      symbolIds
    })
  }

  alignWidth(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignWidth",
      symbolIds
    })
  }

  alignHeight(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignHeight",
      symbolIds
    })
  }

  alignSize(...symbolIds: SymbolId[]) {
    this.hints.push({
      type: "alignSize",
      symbolIds
    })
  }

  enclose(containerId: SymbolId, childIds: SymbolId[]) {
    // Set nestLevel for children
    const container = this.symbols.find(s => s.id === containerId)
    if (container) {
      const containerNestLevel = container.nestLevel
      for (const childId of childIds) {
        const child = this.symbols.find(s => s.id === childId)
        if (child) {
          child.nestLevel = containerNestLevel + 1
          child.containerId = containerId
        }
      }
    }

    this.hints.push({
      type: "enclose",
      symbolIds: [],
      containerId,
      childIds
    })
  }
}
