// src/layout/bounds_builder.ts
import type { LayoutVar, LayoutVariables } from "./layout_variables"
import type { SymbolId } from "../model/types"
import { LayoutBounds } from "../model/symbol_base"

/**
 * BoundsBuilder インターフェース
 * 
 * Symbol に対する Bounds を作成し、各 LayoutVar に一意の ID を付与する
 */
export interface BoundsBuilder {
  /**
   * 基本的な Bounds を作成（x, y, width, height の4つの LayoutVar）
   * @param propertyKey - bounds のプロパティ名（例: "layout", "header"）
   */
  createBase(propertyKey?: string): {
    x: LayoutVar
    y: LayoutVar
    width: LayoutVar
    height: LayoutVar
  }

  /**
   * LayoutBounds を作成
   * @param propertyKey - bounds のプロパティ名
   */
  createLayoutBound(propertyKey?: string): LayoutBounds

  /**
   * ContainerBounds を作成（将来の拡張用）
   * @param propertyKey - bounds のプロパティ名
   */
  createContainerBound(propertyKey?: string): LayoutBounds

  /**
   * 複数の Bounds をまとめて作成
   * @param spec - key と Bounds の種類のマップ
   */
  createSet(spec: Record<string, 'base' | 'layout' | 'container'>): Record<string, LayoutBounds>
}

/**
 * DefaultBoundsBuilder
 * 
 * BoundsBuilder の標準実装
 */
export class DefaultBoundsBuilder implements BoundsBuilder {
  constructor(
    private readonly symbolId: SymbolId,
    private readonly layoutContext: LayoutVariables
  ) {}

  createBase(propertyKey?: string): {
    x: LayoutVar
    y: LayoutVar
    width: LayoutVar
    height: LayoutVar
  } {
    const baseId = propertyKey ? `${this.symbolId}#${propertyKey}` : this.symbolId
    return {
      x: this.layoutContext.createVar(`${baseId}.x`),
      y: this.layoutContext.createVar(`${baseId}.y`),
      width: this.layoutContext.createVar(`${baseId}.width`),
      height: this.layoutContext.createVar(`${baseId}.height`)
    }
  }

  createLayoutBound(propertyKey?: string): LayoutBounds {
    const base = this.createBase(propertyKey)
    return new LayoutBounds(
      this.layoutContext,
      base.x,
      base.y,
      base.width,
      base.height
    )
  }

  createContainerBound(propertyKey?: string): LayoutBounds {
    // 現時点では createLayoutBound と同じ実装
    // 将来的に Container 専用の拡張が必要な場合はここで実装
    return this.createLayoutBound(propertyKey)
  }

  createSet(spec: Record<string, 'base' | 'layout' | 'container'>): Record<string, LayoutBounds> {
    const result: Record<string, LayoutBounds> = {}
    
    for (const [key, type] of Object.entries(spec)) {
      switch (type) {
        case 'base':
        case 'layout':
          result[key] = this.createLayoutBound(key)
          break
        case 'container':
          result[key] = this.createContainerBound(key)
          break
        default:
          throw new Error(`Unknown bounds type: ${type}`)
      }
    }
    
    return result
  }
}
