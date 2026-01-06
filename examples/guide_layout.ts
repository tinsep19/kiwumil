/**
 * Guide Layout Example
 * 
 * Guide API を使ったレイアウトの例
 */

import { TypeDiagram } from "../src/index"

// Example 1: 基本的な整列
TypeDiagram("Guide Example: Basic Alignment")
  .layout(({ el, rel, hint, diagram }) => {
    const title = el.core.rectangle("Title", { width: 120, height: 30 })
    const subtitle = el.core.rectangle("Subtitle", { width: 80, height: 20 })
    const content = el.core.rectangle("Content", { width: 150, height: 100 })
    
    // 垂直ガイドを作成（X = 300）
    const centerGuide = hint.guideX(300)
    
    // すべてのシンボルを X 軸中央揃え
    centerGuide.alignCenter(title, subtitle, content)
    
    // 縦に並べる
    centerGuide.arrange(20)
    hint.enclose(diagram, [title, subtitle, content])
  })
  .render(import.meta)
