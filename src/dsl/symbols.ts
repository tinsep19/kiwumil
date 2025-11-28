import type { SymbolBase } from "../model/symbol_base"
import type { SymbolId } from "../model/types"

/**
 * Symbol 管理クラス
 *
 * Symbol の収集と ID 生成を一元化し、プラグインはこのインスタンスを介して
 * Symbol を登録するだけでよい。
 */
export class Symbols {
  private readonly symbols: SymbolBase[] = []

  /**
   * 指定したプラグインによる Symbol を登録し、factory が返す Symbol を返す。
   */
  register<T extends SymbolBase>(
    plugin: string,
    symbolName: string,
    factory: (symbolId: SymbolId) => T
  ): T {
    const symbolId = this.createSymbolId(plugin, symbolName)
    const symbol = factory(symbolId)
    this.symbols.push(symbol)
    return symbol
  }

  /**
   * 登録済み Symbol を列挙する読み取り専用配列
   */
  getAll(): readonly SymbolBase[] {
    return this.symbols
  }

  /**
   * 指定した ID に一致する Symbol を返す
   */
  findById(id: SymbolId): SymbolBase | undefined {
    return this.symbols.find((symbol) => symbol.id === id)
  }

  /**
   * 登録済み Symbol の数
   */
  get size(): number {
    return this.symbols.length
  }

  private createSymbolId(plugin: string, symbolName: string): SymbolId {
    const idIndex = this.symbols.length
    return `${plugin}:${symbolName}/${idIndex}` as SymbolId
  }
}
