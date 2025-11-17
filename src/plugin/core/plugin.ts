// src/plugin/core/plugin.ts
import { CircleSymbol } from "./symbols/circle_symbol"
import { EllipseSymbol } from "./symbols/ellipse_symbol"
import { RectangleSymbol } from "./symbols/rectangle_symbol"
import { RoundedRectangleSymbol } from "./symbols/rounded_rectangle_symbol"
import { TextSymbol } from "./symbols/text_symbol"
import type { TextInfo } from "./symbols/text_symbol"
import { createIdGenerator } from "../../dsl/id_generator"
import type { DiagramPlugin } from "../../dsl/diagram_plugin"
import type { SymbolBase } from "../../model/symbol_base"
import type { SymbolId } from "../../model/types"

/**
 * Core Plugin (Namespace-based)
 * 
 * 基本的な図形 Symbol を提供する
 */
export const CorePlugin = {
  name: 'core',
  
  createSymbolFactory(userSymbols: SymbolBase[]) {
    const idGen = createIdGenerator(this.name)
    
    return {
      /**
       * Circle Symbol を作成
       * @param label - Circle のラベル
       * @returns 生成された SymbolId
       */
      circle(label: string): SymbolId {
        const id = idGen.generateSymbolId('circle')
        const symbol = new CircleSymbol(id, label)
        userSymbols.push(symbol)
        return id
      },
      
      /**
       * Ellipse Symbol を作成
       * @param label - Ellipse のラベル
       * @returns 生成された SymbolId
       */
      ellipse(label: string): SymbolId {
        const id = idGen.generateSymbolId('ellipse')
        const symbol = new EllipseSymbol(id, label)
        userSymbols.push(symbol)
        return id
      },
      
      /**
       * Rectangle Symbol を作成
       * @param label - Rectangle のラベル
       * @returns 生成された SymbolId
       */
      rectangle(label: string): SymbolId {
        const id = idGen.generateSymbolId('rectangle')
        const symbol = new RectangleSymbol(id, label)
        userSymbols.push(symbol)
        return id
      },
      
      /**
       * Rounded Rectangle Symbol を作成
       * @param label - Rounded Rectangle のラベル
       * @returns 生成された SymbolId
       */
      roundedRectangle(label: string): SymbolId {
        const id = idGen.generateSymbolId('roundedRectangle')
        const symbol = new RoundedRectangleSymbol(id, label)
        userSymbols.push(symbol)
        return id
      },

      /**
       * Text Symbol を作成
       * @param labelOrInfo - 改行やスタイルを含めたテキスト指定
       */
      text(labelOrInfo: string | TextInfo): SymbolId {
        const id = idGen.generateSymbolId('text')
        const symbol = new TextSymbol(id, labelOrInfo)
        userSymbols.push(symbol)
        return id
      }
    }
  }
} as const satisfies DiagramPlugin
