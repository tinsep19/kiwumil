// src/plugin/core/plugin.ts
import { CircleSymbol } from "./symbols/circle_symbol"
import { EllipseSymbol } from "./symbols/ellipse_symbol"
import { RectangleSymbol } from "./symbols/rectangle_symbol"
import { RoundedRectangleSymbol } from "./symbols/rounded_rectangle_symbol"
import { TextSymbol } from "./symbols/text_symbol"
import type { TextInfo } from "./symbols/text_symbol"
import type { DiagramPlugin } from "../../dsl/diagram_plugin"
import type { SymbolsRegistry } from "../../symbols/registry"
import type { SymbolId } from "../../model/types"
import type { LayoutContext } from "../../layout/layout_context"

/**
 * Core Plugin (Namespace-based)
 * 
 * 基本的な図形 Symbol を提供する
 */
export const CorePlugin = {
  name: 'core',
  
  createSymbolFactory(registry: SymbolsRegistry, layout: LayoutContext) {
    return {
      /**
       * Circle Symbol を作成
       * @param label - Circle のラベル
       * @returns 生成された SymbolId
       */
      circle(label: string): SymbolId {
        const symbol = registry.register('core', 'circle', (id, _boundsBuilder) => {
          const symbol = new CircleSymbol(id, label, layout.vars)
          layout.applyFixedSize(symbol)
          return symbol
        })
        return symbol.id
      },
      
      /**
       * Ellipse Symbol を作成
       * @param label - Ellipse のラベル
       * @returns 生成された SymbolId
       */
      ellipse(label: string): SymbolId {
        const symbol = registry.register('core', 'ellipse', (id, _boundsBuilder) => {
          const symbol = new EllipseSymbol(id, label, layout.vars)
          layout.applyFixedSize(symbol)
          return symbol
        })
        return symbol.id
      },
      
      /**
       * Rectangle Symbol を作成
       * @param label - Rectangle のラベル
       * @returns 生成された SymbolId
       */
      rectangle(label: string): SymbolId {
        const symbol = registry.register('core', 'rectangle', (id, _boundsBuilder) => {
          const symbol = new RectangleSymbol(id, label, layout.vars)
          layout.applyFixedSize(symbol)
          return symbol
        })
        return symbol.id
      },
      
      /**
       * Rounded Rectangle Symbol を作成
       * @param label - Rounded Rectangle のラベル
       * @returns 生成された SymbolId
       */
      roundedRectangle(label: string): SymbolId {
        const symbol = registry.register('core', 'roundedRectangle', (id, _boundsBuilder) => {
          const symbol = new RoundedRectangleSymbol(id, label, layout.vars)
          layout.applyFixedSize(symbol)
          return symbol
        })
        return symbol.id
      },

      /**
       * Text Symbol を作成
       * @param labelOrInfo - 改行やスタイルを含めたテキスト指定
       */
      text(labelOrInfo: string | TextInfo): SymbolId {
        const symbol = registry.register('core', 'text', (id, _boundsBuilder) => {
          const symbol = new TextSymbol(id, labelOrInfo, layout.vars)
          layout.applyFixedSize(symbol)
          return symbol
        })
        return symbol.id
      }
    }
  }
} as const satisfies DiagramPlugin
