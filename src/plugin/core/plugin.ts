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
import type { Theme } from "../../theme"

/**
 * Core Plugin (Namespace-based)
 *
 * 基本的な図形 Symbol を提供する
 */
export const CorePlugin = {
  name: "core",

  createSymbolFactory(symbols: Symbols, theme: Theme, _icons: PluginIcons) {
    const plugin = this.name

    return {
      /**
       * Circle Symbol を作成
       * @param label - Circle のラベル
       * @returns 生成された Circle の ISymbolCharacs
       */
      circle(label: string) {
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
        }).characs
      },

      /**
       * Ellipse Symbol を作成
       * @param label - Ellipse のラベル
       * @returns 生成された Ellipse の ISymbolCharacs
       */
      ellipse(label: string) {
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
        }).characs
      },

      /**
       * Rectangle Symbol を作成
       * @param label - Rectangle のラベル
       * @returns 生成された Rectangle の ISymbolCharacs
       */
      rectangle(label: string) {
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
        }).characs
      },

      /**
       * Rounded Rectangle Symbol を作成
       * @param label - Rounded Rectangle のラベル
       * @returns 生成された RoundedRectangle の ISymbolCharacs
       */
      roundedRectangle(label: string) {
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
        }).characs
      },

      /**
       * Text Symbol を作成
       * @param labelOrInfo - 改行やスタイルを含めたテキスト指定
       * @returns 生成された Text の ISymbolCharacs
       */
      text(labelOrInfo: string | TextInfo) {
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
        }).characs
      },
    }
  },
} as const satisfies DiagramPlugin
