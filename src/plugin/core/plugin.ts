// src/plugin/core/plugin.ts
import { CircleSymbol } from "./symbols/circle_symbol"
import { EllipseSymbol } from "./symbols/ellipse_symbol"
import { RectangleSymbol } from "./symbols/rectangle_symbol"
import { RoundedRectangleSymbol } from "./symbols/rounded_rectangle_symbol"
import { TextSymbol } from "./symbols/text_symbol"
import type { TextInfo } from "./symbols/text_symbol"
import type { DiagramPlugin } from "../../dsl/diagram_plugin"
import type { SymbolId } from "../../model/types"
import type { LayoutContext } from "../../layout/layout_context"
import type { Symbols } from "../../dsl/symbols"

/**
 * Core Plugin (Namespace-based)
 *
 * 基本的な図形 Symbol を提供する
 */
export const CorePlugin = {
  name: "core",

  createSymbolFactory(symbols: Symbols, layout: LayoutContext) {
    const plugin = this.name

    return {
      /**
       * Circle Symbol を作成
       * @param label - Circle のラベル
       * @returns 生成された SymbolId
       */
      circle(label: string): SymbolId {
        const symbol = symbols.register(plugin, "circle", (symbolId) => {
          const bound = layout.variables.createBound(symbolId)
          const circle = new CircleSymbol(symbolId, label, bound)
          return circle
        })
        return symbol.id
      },

      /**
       * Ellipse Symbol を作成
       * @param label - Ellipse のラベル
       * @returns 生成された SymbolId
       */
      ellipse(label: string): SymbolId {
        const symbol = symbols.register(plugin, "ellipse", (symbolId) => {
          const bound = layout.variables.createBound(symbolId)
          const ellipse = new EllipseSymbol(symbolId, label, bound)
          return ellipse
        })
        return symbol.id
      },

      /**
       * Rectangle Symbol を作成
       * @param label - Rectangle のラベル
       * @returns 生成された SymbolId
       */
      rectangle(label: string): SymbolId {
        const symbol = symbols.register(plugin, "rectangle", (symbolId) => {
          const bound = layout.variables.createBound(symbolId)
          const rectangle = new RectangleSymbol(symbolId, label, bound)
          return rectangle
        })
        return symbol.id
      },

      /**
       * Rounded Rectangle Symbol を作成
       * @param label - Rounded Rectangle のラベル
       * @returns 生成された SymbolId
       */
      roundedRectangle(label: string): SymbolId {
        const symbol = symbols.register(plugin, "roundedRectangle", (symbolId) => {
          const bound = layout.variables.createBound(symbolId)
          const rounded = new RoundedRectangleSymbol(symbolId, label, bound)
          return rounded
        })
        return symbol.id
      },

      /**
       * Text Symbol を作成
       * @param labelOrInfo - 改行やスタイルを含めたテキスト指定
       */
      text(labelOrInfo: string | TextInfo): SymbolId {
        const symbol = symbols.register(plugin, "text", (symbolId) => {
          const bound = layout.variables.createBound(symbolId)
          const text = new TextSymbol(symbolId, labelOrInfo, bound)
          return text
        })
        return symbol.id
      },
    }
  },
} as const satisfies DiagramPlugin
