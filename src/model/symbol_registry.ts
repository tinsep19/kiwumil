// src/model/symbol_registry.ts
import type { SymbolBase } from "./symbol_base"
import type { SymbolId } from "./types"

export type SymbolConstructor = new (id: SymbolId, label: string) => SymbolBase

export class SymbolRegistry {
  private types = new Map<string, SymbolConstructor>()

  register(typeName: string, constructor: SymbolConstructor) {
    this.types.set(typeName, constructor)
  }

  create(typeName: string, id: SymbolId, label: string): SymbolBase {
    const Constructor = this.types.get(typeName)
    if (!Constructor) {
      throw new Error(`Unknown symbol type: ${typeName}`)
    }
    return new Constructor(id, label)
  }

  has(typeName: string): boolean {
    return this.types.has(typeName)
  }
}
