// src/model/symbol_base_themed.ts
import type { SymbolId, Bounds } from "./types"
import type { Theme } from "../core/theme"
import { defaultTheme } from "../core/theme"

export abstract class SymbolBase {
  readonly id: SymbolId
  readonly label: string
  bounds?: Bounds
  protected theme: Theme

  constructor(id: SymbolId, label: string, theme?: Theme) {
    this.id = id
    this.label = label
    this.theme = theme || defaultTheme
  }

  setTheme(theme: Theme) {
    this.theme = theme
  }

  abstract getDefaultSize(): { width: number; height: number }

  abstract toSVG(): string
}
