// src/plugin/core/index.ts
import { CircleSymbol } from "./symbols/circle_symbol"
import { EllipseSymbol } from "./symbols/ellipse_symbol"
import { RectangleSymbol } from "./symbols/rectangle_symbol"
import { RoundedRectangleSymbol } from "./symbols/rounded_rectangle_symbol"
import { KiwumilPlugin } from "../../dsl/plugin_manager"
import { SymbolRegistry } from "../../model/symbol_registry"
import { RelationshipRegistry } from "../../model/relationship_registry"

export const CorePlugin: KiwumilPlugin = {
  name: "CorePlugin",
  registerSymbols(symbols: SymbolRegistry) {
    symbols.register("circle", CircleSymbol)
    symbols.register("ellipse", EllipseSymbol)
    symbols.register("rectangle", RectangleSymbol)
    symbols.register("roundedRectangle", RoundedRectangleSymbol)
  },
  registerRelationships(relationships: RelationshipRegistry) {
    // CorePluginでは関係を登録しない
  }
}
