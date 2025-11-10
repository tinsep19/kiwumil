// src/dsl/element_factory.ts
import type { SymbolRegistry } from "../model/symbol_registry"
import type { SymbolBase } from "../model/symbol_base"
import type { SymbolId } from "../model/types"

export class ElementFactory {
  private counter = 0

  constructor(
    private registry: SymbolRegistry,
    private symbols: SymbolBase[]
  ) {
    // Proxyを使って動的にメソッドを生成
    return new Proxy(this, {
      get(target, prop: string) {
        // 既存のメソッド/プロパティがあればそれを返す
        if (prop in target) {
          return target[prop as keyof typeof target]
        }
        
        // RegistryにSymbolが登録されていれば動的メソッドを返す
        if (target.registry.has(prop)) {
          return (label: string) => target.create(prop, label)
        }
        
        return undefined
      }
    })
  }

  create(typeName: string, label: string): SymbolId {
    const id = `${typeName}_${this.counter++}`
    const symbol = this.registry.create(typeName, id, label)
    this.symbols.push(symbol)
    return id
  }

  // 後方互換性のため残しておく（UMLPlugin用）
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
