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
import type { LayoutContext } from "../../model"
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
        return symbols.register(plugin, "circle", (symbolId, r) => {
          const bound = r.createBounds("layout", "layout")
          const circle = new CircleSymbol({
            id: symbolId,
            layout: bound,
            label,
            theme,
          })
          r.setSymbol(circle)
          r.setCharacs({ id: symbolId, layout: bound })
          r.setConstraint((builder) => {
            circle.ensureLayoutBounds(builder)
          })
          return r.build()
        }).symbol as CircleSymbol
      },

      /**
       * Ellipse Symbol を作成
       * @param label - Ellipse のラベル
       * @returns 生成された EllipseSymbol
       */
      ellipse(label: string): EllipseSymbol {
        return symbols.register(plugin, "ellipse", (symbolId, r) => {
          const bound = r.createBounds("layout", "layout")
          const ellipse = new EllipseSymbol({
            id: symbolId,
            layout: bound,
            label,
            theme,
          })
          r.setSymbol(ellipse)
          r.setCharacs({ id: symbolId, layout: bound })
          r.setConstraint((builder) => {
            ellipse.ensureLayoutBounds(builder)
          })
          return r.build()
        }).symbol as EllipseSymbol
      },

      /**
       * Rectangle Symbol を作成
       * @param label - Rectangle のラベル
       * @returns 生成された RectangleSymbol
       */
      rectangle(label: string): RectangleSymbol {
        return symbols.register(plugin, "rectangle", (symbolId, r) => {
          const bound = r.createBounds("layout", "layout")
          const rectangle = new RectangleSymbol({
            id: symbolId,
            layout: bound,
            label,
            theme,
          })
          r.setSymbol(rectangle)
          r.setCharacs({ id: symbolId, layout: bound })
          r.setConstraint((builder) => {
            rectangle.ensureLayoutBounds(builder)
          })
          return r.build()
        }).symbol as RectangleSymbol
      },

      /**
       * Rounded Rectangle Symbol を作成
       * @param label - Rounded Rectangle のラベル
       * @returns 生成された RoundedRectangleSymbol
       */
      roundedRectangle(label: string): RoundedRectangleSymbol {
        return symbols.register(plugin, "roundedRectangle", (symbolId, r) => {
          const bound = r.createBounds("layout", "layout")
          const rounded = new RoundedRectangleSymbol({
            id: symbolId,
            layout: bound,
            label,
            theme,
          })
          r.setSymbol(rounded)
          r.setCharacs({ id: symbolId, layout: bound })
          r.setConstraint((builder) => {
            rounded.ensureLayoutBounds(builder)
          })
          return r.build()
        }).symbol as RoundedRectangleSymbol
      },

      /**
       * Text Symbol を作成
       * @param labelOrInfo - 改行やスタイルを含めたテキスト指定
       * @returns 生成された TextSymbol
       */
      text(labelOrInfo: string | TextInfo): TextSymbol {
        return symbols.register(plugin, "text", (symbolId, r) => {
          const bound = r.createBounds("layout", "layout")
          const text = new TextSymbol({
            id: symbolId,
            layout: bound,
            info: labelOrInfo,
            theme,
          })
          r.setSymbol(text)
          r.setCharacs({ id: symbolId, layout: bound })
          r.setConstraint((builder) => {
            text.ensureLayoutBounds(builder)
          })
          return r.build()
        }).symbol as TextSymbol
      },
    }
  },
} as const satisfies DiagramPlugin
