# Diagram Container Layout 対応

**作成日**: 2025-11-19  
**ステータス**: 分析中

## 問題

Grid/Figure Builder を作成したが、diagram 全体のレイアウトを行うことができない。

### 原因

1. DiagramSymbol は `"__diagram__"` 固定のContainerSymbolIdを持つ
2. DiagramSymbol はユーザー定義シンボル作成**後**に生成される
3. そのため、callback内で `hint.grid(diagramContainerId)` のように指定できない

### ユーザーの要望

diagram内部をGrid/Figure Builderで大まかに配置したい。

```typescript
// 理想的な使い方
TypeDiagram("My Diagram")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    const actor1 = el.uml.actor("User")
    const actor2 = el.uml.actor("Admin")
    const usecase = el.uml.usecase("Login")
    
    // diagram全体をグリッドレイアウト
    hint.grid(DIAGRAM_CONTAINER_ID)
      .enclose([[actor1, usecase, actor2]] as const)
      .gap(20)
      .layout()
  })
```

## 解決案

### A. DIAGRAM_CONTAINER_ID を export + DiagramSymbol 事前生成

#### 実装手順

1. **定数の export**
   ```typescript
   // src/model/types.ts
   export const DIAGRAM_CONTAINER_ID = "__diagram__" as ContainerSymbolId
   ```

2. **DiagramSymbol の事前生成**
   ```typescript
   // src/dsl/diagram_builder.ts
   build(callback: IntelliSenseBlock<TPlugins>) {
     const userSymbols: SymbolBase[] = []
     const relationships: RelationshipBase[] = []
     
     const layoutContext = new LayoutContext(...)
     
     // DiagramSymbolを先に生成（制約は適用しない）
     const diagramSymbol = new DiagramSymbol(
       DIAGRAM_CONTAINER_ID, 
       this.titleOrInfo, 
       layoutContext,
       { deferConstraints: true } // オプション追加
     )
     diagramSymbol.setTheme(this.currentTheme)
     
     // HintFactoryに渡す
     const hint = new HintFactory(layoutContext, userSymbols, diagramSymbol)
     
     // callbackを実行（この中でdiagram containerを参照可能）
     callback(el, rel, hint)
     
     // ユーザー定義シンボルが確定したら、デフォルトのenclose制約を適用
     // ただし、ユーザーがGrid/Figure Builderで明示的に指定した場合は不要
     if (userSymbols.length > 0 && !layoutContext.hasExplicitContainerLayout(DIAGRAM_CONTAINER_ID)) {
       hint.enclose(DIAGRAM_CONTAINER_ID, userSymbols.map(s => s.id))
     }
     
     // 最後にdiagram制約を確定
     diagramSymbol.applyDiagramConstraints()
     
     // レイアウト計算
     const allSymbols = [diagramSymbol, ...userSymbols]
     const solver = new LayoutSolver(layoutContext)
     solver.solve(allSymbols)
     
     return { ... }
   }
   ```

3. **DiagramSymbol のコンストラクタ修正**
   ```typescript
   // src/model/diagram_symbol.ts
   constructor(
     id: ContainerSymbolId, 
     titleOrInfo: string | DiagramInfo, 
     layout: LayoutContext,
     options?: { deferConstraints?: boolean }
   ) {
     // ...
     if (!options?.deferConstraints) {
       this.applyDiagramConstraints()
     }
   }
   
   // 公開メソッド化
   public applyDiagramConstraints() {
     if (this.constraintsApplied) return
     this.layout.anchorToOrigin(this, LayoutConstraintStrength.Strong)
     this.layout.applyMinSize(this, { width: 200, height: 150 }, LayoutConstraintStrength.Weak)
     this.constraintsApplied = true
   }
   ```

4. **LayoutContext に追跡機能追加**
   ```typescript
   // src/layout/layout_context.ts
   private explicitContainerLayouts = new Set<ContainerSymbolId>()
   
   markExplicitContainerLayout(containerId: ContainerSymbolId) {
     this.explicitContainerLayouts.add(containerId)
   }
   
   hasExplicitContainerLayout(containerId: ContainerSymbolId): boolean {
     return this.explicitContainerLayouts.has(containerId)
   }
   ```

5. **Grid/Figure Builder でマーク**
   ```typescript
   // src/dsl/grid_builder.ts / figure_builder.ts
   layout(): void {
     this.layoutContext.markExplicitContainerLayout(this.containerId)
     // 既存のレイアウト処理
     // ...
   }
   ```

### メリット

- ユーザーはDIAGRAM_CONTAINER_IDを使用してdiagram全体をレイアウト可能
- 既存のコードとの互換性を維持
- Grid/Figure Builderの使い方が統一される
- 明示的レイアウトがない場合はデフォルトのenclose動作を維持

### デメリット

- DiagramSymbolのコンストラクタにオプション追加（軽微）
- LayoutContextに状態管理追加（軽微）

## 次のアクション

1. この案をレビュー・承認
2. 実装開始
3. テストケース追加
4. ドキュメント更新

## 関連ファイル

- `src/model/types.ts`
- `src/model/diagram_symbol.ts`
- `src/dsl/diagram_builder.ts`
- `src/layout/layout_context.ts`
- `src/dsl/grid_builder.ts`
- `src/dsl/figure_builder.ts`
