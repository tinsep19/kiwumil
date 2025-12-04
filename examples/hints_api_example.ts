/**
 * Hints.createHintVariable() Example
 * 
 * Hints.createHintVariable() を使った高度なレイアウトの例
 * カスタムアンカー変数を作成して、複雑な制約を構築する
 */

import { TypeDiagram } from "../src/index"

// Example: カスタムアンカーを使った中央寄せレイアウト
TypeDiagram("Hints API Example: Custom Anchors")
  .build((el, rel, hint) => {
    const box1 = el.core.rectangle("Box 1")
    const box2 = el.core.rectangle("Box 2")
    const box3 = el.core.rectangle("Box 3")
    
    // Hints API を使ってカスタムアンカー変数を作成
    // これらの変数は Symbols に登録されず、Hints が管理する
    const centerX = hint.getLayoutContext().hints.createHintVariable({
      baseName: "anchor",
      name: "centerX"
    })
    
    const topY = hint.getLayoutContext().hints.createHintVariable({
      baseName: "anchor", 
      name: "topY"
    })
    
    // アンカーの位置を固定
    hint.getLayoutContext().createConstraint("anchor/centerX/value", (builder) => {
      builder.expr([1, centerX.variable]).eq([300, 1]).required()
    })
    
    hint.getLayoutContext().createConstraint("anchor/topY/value", (builder) => {
      builder.expr([1, topY.variable]).eq([100, 1]).required()
    })
    
    // Box1 を中央アンカーに左揃え、上アンカーに配置
    hint.getLayoutContext().createConstraint("box1/align", (builder) => {
      builder.expr([1, box1.layout.x]).eq([1, centerX.variable]).strong()
      builder.expr([1, box1.layout.y]).eq([1, topY.variable]).strong()
    })
    
    // Box2 を Box1 の下に配置
    hint.arrangeVertical(box1, box2)
    hint.getLayoutContext().createConstraint("box2/x", (builder) => {
      // Box2 も中央アンカーに左揃え
      builder.expr([1, box2.layout.x]).eq([1, centerX.variable]).strong()
    })
    
    // Box3 を Box2 の下に配置
    hint.arrangeVertical(box2, box3)
    hint.getLayoutContext().createConstraint("box3/x", (builder) => {
      // Box3 も中央アンカーに左揃え
      builder.expr([1, box3.layout.x]).eq([1, centerX.variable]).strong()
    })
    
    // 作成されたヒント変数を確認（開発時のデバッグ用）
    const hintVars = hint.getLayoutContext().hints.getHintVariables()
    console.log("Created hint variables:", hintVars.map(v => v.name))
  })
  .render(import.meta)

/**
 * この例では、Hints.createHintVariable() を使って以下を実現している：
 * 
 * 1. カスタムアンカー変数（centerX, topY）を作成
 * 2. アンカーの位置を固定
 * 3. 複数のシンボルをアンカーに制約で結び付ける
 * 4. Symbols に登録しないため、通常のシンボルレイアウトとは独立している
 * 
 * 利点：
 * - Guide よりも柔軟な制約を記述できる
 * - 複雑なレイアウトロジックを変数として抽象化できる
 * - デバッグ時に getHintVariables() で追跡可能
 * 
 * 注意：
 * - 通常のレイアウトには hint.createGuideX/Y() や hint.arrange*() を推奨
 * - createHintVariable() は高度なユースケース向け
 */
