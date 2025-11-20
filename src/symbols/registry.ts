// src/symbols/registry.ts
import type { SymbolBase } from "../model/symbol_base"
import type { SymbolId } from "../model/types"
import type { BoundsBuilder } from "../layout/bounds_builder"
import type { LayoutContext } from "../layout/layout_context"
import { DefaultBoundsBuilder } from "../layout/bounds_builder"

/**
 * SymbolsRegistry
 * 
 * シンボルの登録と管理を一元的に行うレジストリ
 * - ID 生成の統一（${owner}:${name}/${index} 形式）
 * - シンボルの push 忘れを防止
 * - BoundsBuilder による Bounds/LayoutVar への ID 付与
 */
export class SymbolsRegistry {
  private readonly symbols: SymbolBase[] = []
  private symbolCounter: number = 0
  private readonly layoutContext: LayoutContext

  constructor(layoutContext: LayoutContext) {
    this.layoutContext = layoutContext
  }

  /**
   * シンボルを登録
   * 
   * @param owner - プラグイン名（例: "core", "uml"）
   * @param name - シンボル種別（例: "rectangle", "actor"）
   * @param factory - シンボルを生成する関数
   * @returns 登録されたシンボル
   * 
   * @example
   * ```typescript
   * const symbol = registry.register('core', 'rectangle', (id, boundsBuilder) => {
   *   const bounds = boundsBuilder.createLayoutBound('layout')
   *   return new RectangleSymbol(id, 'My Rectangle', bounds)
   * })
   * ```
   */
  register<T extends SymbolBase>(
    owner: string,
    name: string,
    factory: (symbolId: SymbolId, boundsBuilder: BoundsBuilder) => T
  ): T {
    // ID を生成（${owner}:${name}/${index} 形式）
    const symbolId = `${owner}:${name}/${this.symbolCounter++}` as SymbolId
    
    // BoundsBuilder を作成
    const boundsBuilder = new DefaultBoundsBuilder(symbolId, this.layoutContext.vars)
    
    // Factory を呼び出してシンボルを生成
    const symbol = factory(symbolId, boundsBuilder)
    
    // 内部配列に追加
    this.symbols.push(symbol)
    
    return symbol
  }

  /**
   * ID でシンボルを取得
   * 
   * @param id - 取得するシンボルの ID
   * @returns シンボル、または undefined
   */
  get(id: SymbolId): SymbolBase | undefined {
    return this.symbols.find(s => s.id === id)
  }

  /**
   * すべてのシンボルを取得
   * 
   * @returns 登録されているすべてのシンボルの配列
   */
  list(): SymbolBase[] {
    return [...this.symbols]
  }

  /**
   * シンボルを削除
   * 
   * @param id - 削除するシンボルの ID
   * @returns 削除に成功した場合 true、シンボルが見つからなかった場合 false
   */
  remove(id: SymbolId): boolean {
    const index = this.symbols.findIndex(s => s.id === id)
    if (index === -1) {
      return false
    }
    this.symbols.splice(index, 1)
    return true
  }

  /**
   * 登録済みシンボル数を取得
   * 
   * @returns 現在登録されているシンボルの数
   */
  count(): number {
    return this.symbols.length
  }

  /**
   * すべてのシンボルをクリア（テスト用）
   */
  clear(): void {
    this.symbols.length = 0
    this.symbolCounter = 0
  }
}
