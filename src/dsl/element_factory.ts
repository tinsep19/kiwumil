// src/dsl/element_factory.ts
import type { SymbolRegistry } from "../model/symbol_registry"
import type { SymbolBase } from "../model/symbol_base"
import type { SymbolId } from "../model/types"

export class ElementFactory {
  private counter = 0

  constructor(
    private registry: SymbolRegistry,
    private symbols: SymbolBase[]
  ) {}

  create(typeName: string, label: string): SymbolId {
    const id = `${typeName}_${this.counter++}`
    const symbol = this.registry.create(typeName, id, label)
    this.symbols.push(symbol)
    return id
  }

  actor(label: string): SymbolId {
    return this.create("actor", label)
  }

  usecase(label: string): SymbolId {
    return this.create("usecase", label)
  }

  systemBoundary(label: string): SymbolId {
    return this.create("systemBoundary", label)
  }
}
