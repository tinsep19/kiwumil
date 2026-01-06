/**
 * Hints API Example
 * 
 * Guide API を使った高度なレイアウトの例
 * カスタムアンカー（ガイド）を作成して、複雑な制約を構築する
 */

import { TypeDiagram } from "../src/index"

// Example: ガイドを使った中央寄せレイアウト
TypeDiagram("Hints API Example: Custom Anchors with Guides")
  .layout(({ el, rel, hint }) => {
    const box1 = el.core.rectangle("Box 1")
    const box2 = el.core.rectangle("Box 2")
    const box3 = el.core.rectangle("Box 3")
    
    // Guide API を使ってガイドを作成
    // これらのガイドはアンカーとして機能し、シンボルの配置を制御する
    const centerGuide = hint.guideX(300)  // X = 300 の垂直ガイドライン（縦線）
    const topGuide = hint.guideY(100)     // Y = 100 の水平ガイドライン（横線）
    
    // Box1 を上部のガイドに配置
    topGuide.alignTop(box1)
    
    // すべてのボックスを中央ガイドに左揃え
    centerGuide.alignLeft(box1, box2, box3)
    
    // Box2 を Box1 の下に配置
    hint.arrangeVertical(box1, box2)
    
    // Box3 を Box2 の下に配置
    hint.arrangeVertical(box2, box3)
  })
  .render(import.meta)

/**
 * この例では、Guide API を使って以下を実現している：
 * 
 * 1. カスタムガイド（centerGuide, topGuide）を作成
 * 2. ガイドの位置を固定（X=300, Y=100）
 * 3. 複数のシンボルをガイドに整列
 * 4. シンボル間の垂直配置を設定
 * 
 * 利点：
 * - ガイドを使うことで、複数のシンボルを一貫して配置できる
 * - コードが直感的で理解しやすい
 * - Guide API は制約を自動的に管理する
 * 
 * 注意：
 * - 通常のレイアウトには hint.guideX/Y() や hint.arrange*() を推奨
 * - より複雑な制約が必要な場合は、直接 LayoutContext にアクセスすることも可能
 */
