// src/dsl/element_factory.ts
import type { SymbolRegistry } from "../model/symbol_registry"
import type { SymbolBase } from "../model/symbol_base"

export class ElementFactory {
  private counter = 0

  constructor(
    private registry: SymbolRegistry,
    private symbols: SymbolBase[]
  ) {}

  create(typeName: string, label: string): SymbolBase {
    const id = `${typeName}_${this.counter++}`
    const symbol = this.registry.create(typeName, id, label)
    this.symbols.push(symbol)
    return symbol
  }

  actor(label: string): SymbolBase {
    return this.create("actor", label)
  }

  usecase(label: string): SymbolBase {
    return this.create("usecase", label)
  }
}
