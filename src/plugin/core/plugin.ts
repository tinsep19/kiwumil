// src/plugin/core/plugin.ts
import {
  CircleSymbol,
  EllipseSymbol,
  RectangleSymbol,
  RoundedRectangleSymbol,
  TextSymbol,
  type TextInfo,
} from "./symbols"
import type { DiagramPlugin, PluginIcons, Symbols } from "../../dsl"
import type { LayoutContext } from "../../layout"
import type { Theme } from "../../theme"

/**
 * Core Plugin (Namespace-based)
 *
 * 基本的な図形 Symbol を提供する
 */
export const CorePlugin = {
  name: "core",

  createSymbolFactory(symbols: Symbols, context: LayoutContext, theme: Theme, _icons: PluginIcons) {
    const plugin = this.name

    return {
      /**
       * Circle Symbol を作成
       * @param label - Circle のラベル
       * @returns 生成された CircleSymbol
       */
      circle(label: string): CircleSymbol {
        return symbols.register(plugin, "circle", (symbolId) => {
          const bound = context.variables.createBound(symbolId)
          const circle = new CircleSymbol({
            id: symbolId,
            layout: bound,
            label,
            theme,
          })
          context.constraints.withSymbol(symbolId, "symbolBounds", (builder) => {
            circle.ensureLayoutBounds(builder)
          })
          return circle
        })
      },

      /**
       * Ellipse Symbol を作成
       * @param label - Ellipse のラベル
       * @returns 生成された EllipseSymbol
       */
      ellipse(label: string): EllipseSymbol {
        return symbols.register(plugin, "ellipse", (symbolId) => {
          const bound = context.variables.createBound(symbolId)
          const ellipse = new EllipseSymbol({
            id: symbolId,
            layout: bound,
            label,
            theme,
          })
          context.constraints.withSymbol(symbolId, "symbolBounds", (builder) => {
            ellipse.ensureLayoutBounds(builder)
          })
          return ellipse
        })
      },

      /**
       * Rectangle Symbol を作成
       * @param label - Rectangle のラベル
       * @returns 生成された RectangleSymbol
       */
      rectangle(label: string): RectangleSymbol {
        return symbols.register(plugin, "rectangle", (symbolId) => {
          const bound = context.variables.createBound(symbolId)
          const rectangle = new RectangleSymbol({
            id: symbolId,
            layout: bound,
            label,
            theme,
          })
          context.constraints.withSymbol(symbolId, "symbolBounds", (builder) => {
            rectangle.ensureLayoutBounds(builder)
          })
          return rectangle
        })
      },

      /**
       * Rounded Rectangle Symbol を作成
       * @param label - Rounded Rectangle のラベル
       * @returns 生成された RoundedRectangleSymbol
       */
      roundedRectangle(label: string): RoundedRectangleSymbol {
        return symbols.register(plugin, "roundedRectangle", (symbolId) => {
          const bound = context.variables.createBound(symbolId)
          const rounded = new RoundedRectangleSymbol({
            id: symbolId,
            layout: bound,
            label,
            theme,
          })
          context.constraints.withSymbol(symbolId, "symbolBounds", (builder) => {
            rounded.ensureLayoutBounds(builder)
          })
          return rounded
        })
      },

      /**
       * Text Symbol を作成
       * @param labelOrInfo - 改行やスタイルを含めたテキスト指定
       * @returns 生成された TextSymbol
       */
      text(labelOrInfo: string | TextInfo): TextSymbol {
        return symbols.register(plugin, "text", (symbolId) => {
          const bound = context.variables.createBound(symbolId)
          const text = new TextSymbol({
            id: symbolId,
            layout: bound,
            info: labelOrInfo,
            theme,
          })
          context.constraints.withSymbol(symbolId, "symbolBounds", (builder) => {
            text.ensureLayoutBounds(builder)
          })
          return text
        })
      },
    }
  },
} as const satisfies DiagramPlugin
