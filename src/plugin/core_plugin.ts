// src/plugin/core_plugin.ts
import { ActorSymbol } from "../model/symbols/actor_symbol"
import { KiwumilPlugin } from "../dsl/plugin_manager"
import { SymbolRegistry } from "../model/symbol_registry"
import { RelationshipRegistry } from "../model/relationship_registry"

export const CorePlugin: KiwumilPlugin = {
  name: "CorePlugin",
  registerSymbols(symbols: SymbolRegistry) {
    symbols.register("actor", ActorSymbol)
  },
  registerRelationships(relationships: RelationshipRegistry) {
    // CorePluginではまだ関係を登録しない
  }
}
