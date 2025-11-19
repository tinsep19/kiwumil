# Diagram全体のレイアウト問題と解決策

**作成日:** 2025-11-19  
**ステータス:** 🔍 検討中

## 問題の概要

Grid/Figure Builder を作成したが、**diagram 全体のレイアウトを行うことができない**。

### 現状の実装フロー

```typescript
TypeDiagram("Title")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    // 1. ユーザーがシンボルを定義
    const a = el.core.circle("A")
    const b = el.core.circle("B")
    
    // 2. Grid/Figure Builder は任意のコンテナに適用できる
    const boundary = el.uml.systemBoundary("System")
    hint.grid(boundary).enclose([[a, b]]).layout()  // ✅ OK
    
    // 3. しかし、diagram 全体には適用できない
    // hint.grid(diagram).enclose([[a, b]]).layout()  // ❌ diagram がまだ存在しない
  })
  // 4. build() の内部で DiagramSymbol が作成される
  //    → この時点で hint.enclose(diagram, [a, b]) が自動適用
```

### 問題の本質

**DiagramSymbol の生成タイミング:**
- `build()` 内部でユーザーコールバック実行 **後** に `DiagramSymbol` が作成される
- ユーザーはコールバック内で `diagram` にアクセスできない

**Grid/Figure Builder の前提:**
- コンテナが既に存在している必要がある
- `hint.grid(container)` の `container` は SymbolId

## 要求

**ユーザーの意図:**
diagram 全体を Grid/Figure Builder で大まかに配置したい。

```typescript
TypeDiagram("Title")
  .build((el, rel, hint, diagram) => {  // ← diagram を参照したい
    const a = el.core.circle("A")
    const b = el.core.circle("B")
    const c = el.core.circle("C")
    
    // diagram 全体を 2x2 グリッドで配置
    hint.grid(diagram)
      .enclose([[a, b], [c, null]])
      .gap(20)
      .layout()
  })
```

## 解決策の候補

### 案1: DiagramSymbol を事前生成

**変更内容:**
- `build()` 開始時に `DiagramSymbol` を作成
- コールバックの第4引数として `diagram` を渡す

**実装:**

```typescript
// src/dsl/diagram_builder.ts
build(callback: IntelliSenseBlock<TPlugins>) {
  const userSymbols: SymbolBase[] = []
  const relationships: RelationshipBase[] = []
  
  const diagramSymbolId = toContainerSymbolId("__diagram__")
  const layoutContext = new LayoutContext(
    this.currentTheme,
    (id: SymbolId) => {
      if (diagramSymbol && diagramSymbol.id === id) {
        return diagramSymbol
      }
      return userSymbols.find(s => s.id === id)
    }
  )
  
  // ✅ DiagramSymbol を先に作成
  const diagramSymbol = new DiagramSymbol(
    diagramSymbolId,
    this.titleOrInfo,
    layoutContext
  )
  diagramSymbol.setTheme(this.currentTheme)
  
  const namespaceBuilder = new NamespaceBuilder(this.plugins)
  const el = namespaceBuilder.buildElementNamespace(userSymbols, layoutContext)
  const rel = namespaceBuilder.buildRelationshipNamespace(relationships, layoutContext)
  const hint = new HintFactory(layoutContext, userSymbols)
  
  // ✅ diagram を第4引数で渡す
  callback(el, rel, hint, diagramSymbolId)
  
  // ... 以降は同じ
}
```

**コールバック型の変更:**

```typescript
type IntelliSenseBlock<TPlugins extends readonly DiagramPlugin[]> = (
  el: BuildElementNamespace<TPlugins>,
  rel: BuildRelationshipNamespace<TPlugins>,
  hint: HintFactory,
  diagram: ContainerSymbolId  // ← 第4引数追加
) => void
```

**メリット:**
- ✅ ユーザーは `diagram` に直接アクセス可能
- ✅ `hint.grid(diagram)` が使える
- ✅ 既存コードとの互換性を保てる（第4引数は省略可能）

**デメリット:**
- DiagramSymbol が空の状態で存在する期間がある
- コールバックの引数が増える（4つ）

---

### 案2: 特別なトップレベル Builder を提供

**変更内容:**
- `hint.diagramGrid()` / `hint.diagramFigure()` のような専用APIを追加
- 内部で DiagramSymbol を特別扱い

**実装:**

```typescript
// src/dsl/hint_factory.ts
export class HintFactory {
  /**
   * Diagram 全体を Grid レイアウト
   */
  diagramGrid(): DiagramGridBuilder {
    return new DiagramGridBuilder(this)
  }
  
  /**
   * Diagram 全体を Figure レイアウト
   */
  diagramFigure(): DiagramFigureBuilder {
    return new DiagramFigureBuilder(this)
  }
}

// src/dsl/diagram_grid_builder.ts
export class DiagramGridBuilder {
  private matrix?: SymbolId[][]
  
  constructor(private readonly hint: HintFactory) {}
  
  enclose(matrix: SymbolId[][]): this {
    this.matrix = matrix
    return this
  }
  
  gap(gap: number | { row?: number; col?: number }): this {
    // ...
    return this
  }
  
  layout(): void {
    // 内部で DiagramSymbol の ID を解決
    const diagram = this.hint.getDiagramSymbolId()
    this.hint.getLayoutContext().constraints.encloseGrid(
      diagram,
      this.matrix!,
      this.options
    )
  }
}
```

**使用例:**

```typescript
TypeDiagram("Title")
  .build((el, rel, hint) => {
    const a = el.core.circle("A")
    const b = el.core.circle("B")
    
    // Diagram 全体をグリッド配置
    hint.diagramGrid()
      .enclose([[a, b]])
      .gap(20)
      .layout()
  })
```

**メリット:**
- ✅ コールバックの引数を増やさない
- ✅ diagram ID を隠蔽できる
- ✅ ユーザーにとって直感的

**デメリット:**
- 内部で DiagramSymbol の特別扱いが必要
- `hint.grid()` と `hint.diagramGrid()` の2つのAPIが存在

---

### 案3: 後処理で DiagramSymbol の制約を上書き

**変更内容:**
- 自動適用される `hint.enclose(diagram, allSymbols)` を無効化
- ユーザーが明示的にレイアウトを指定した場合のみ適用

**実装:**

```typescript
// src/dsl/diagram_builder.ts
build(callback: IntelliSenseBlock<TPlugins>) {
  // ...
  callback(el, rel, hint)
  
  // DiagramSymbol を作成
  const diagramSymbol = new DiagramSymbol(diagramSymbolId, this.titleOrInfo, layoutContext)
  
  // ユーザーが diagram レイアウトを指定したかチェック
  const userSpecifiedDiagramLayout = hint.hasDiagramLayout()
  
  if (!userSpecifiedDiagramLayout && userSymbols.length > 0) {
    // デフォルト: 全シンボルを enclose
    hint.enclose(diagramSymbolId, userSymbols.map(s => s.id))
  }
  
  // ... solve()
}
```

**使用例:**

```typescript
TypeDiagram("Title")
  .build((el, rel, hint) => {
    const a = el.core.circle("A")
    const b = el.core.circle("B")
    
    // hint.diagramGrid() を呼ぶと自動 enclose が無効化される
    hint.diagramGrid()
      .enclose([[a, b]])
      .layout()
  })
```

**メリット:**
- ✅ ユーザーにとって明示的
- ✅ デフォルト動作を維持しつつ、上書き可能

**デメリット:**
- 内部状態の管理が複雑
- DiagramSymbol の ID を解決する仕組みが必要

---

## 推奨案

**案1: DiagramSymbol を事前生成** を推奨します。

### 理由

1. **最もシンプル**
   - DiagramSymbol を先に作るだけ
   - 既存の Grid/Figure Builder をそのまま使える

2. **一貫性**
   - `hint.grid(container)` と同じAPIで `hint.grid(diagram)` が使える
   - 特別なAPIが不要

3. **拡張性**
   - ユーザーが `diagram` を直接参照できる
   - 将来的に `diagram` に対する他の操作も可能

4. **互換性**
   - 第4引数は省略可能
   - 既存コードを壊さない

### 実装詳細

#### 1. コールバック型の変更

```typescript
type IntelliSenseBlock<TPlugins extends readonly DiagramPlugin[]> = (
  el: BuildElementNamespace<TPlugins>,
  rel: BuildRelationshipNamespace<TPlugins>,
  hint: HintFactory,
  diagram: ContainerSymbolId  // ← 追加
) => void
```

#### 2. DiagramBuilder.build() の変更

```typescript
build(callback: IntelliSenseBlock<TPlugins>) {
  const userSymbols: SymbolBase[] = []
  const relationships: RelationshipBase[] = []
  const diagramSymbolId = toContainerSymbolId("__diagram__")
  
  // LayoutContext を作成
  let diagramSymbol: DiagramSymbol | undefined
  const layoutContext = new LayoutContext(
    this.currentTheme,
    (id: SymbolId) => {
      if (diagramSymbol && diagramSymbol.id === id) {
        return diagramSymbol
      }
      return userSymbols.find(s => s.id === id)
    }
  )
  
  // ✅ DiagramSymbol を先に作成
  diagramSymbol = new DiagramSymbol(
    diagramSymbolId,
    this.titleOrInfo,
    layoutContext
  )
  diagramSymbol.setTheme(this.currentTheme)
  
  const namespaceBuilder = new NamespaceBuilder(this.plugins)
  const el = namespaceBuilder.buildElementNamespace(userSymbols, layoutContext)
  const rel = namespaceBuilder.buildRelationshipNamespace(relationships, layoutContext)
  const hint = new HintFactory(layoutContext, userSymbols)
  
  // ✅ diagram を第4引数で渡す
  callback(el, rel, hint, diagramSymbolId)
  
  const allSymbols: SymbolBase[] = [diagramSymbol, ...userSymbols]
  
  // テーマを適用
  for (const symbol of userSymbols) {
    symbol.setTheme(this.currentTheme)
  }
  for (const relationship of relationships) {
    relationship.setTheme(this.currentTheme)
  }
  
  // DiagramSymbol がすべてのユーザー Symbol を enclose
  // ✅ ユーザーが明示的に diagram レイアウトを指定していない場合のみ
  if (userSymbols.length > 0 && !hint.hasDiagramLayoutConstraints(diagramSymbolId)) {
    hint.enclose(diagramSymbolId, userSymbols.map(s => s.id))
  }
  
  // レイアウト計算
  const solver = new LayoutSolver(layoutContext)
  solver.solve(allSymbols)
  
  return {
    symbols: allSymbols,
    relationships,
    render: (target: string | ImportMeta | Element) => {
      // ...
    }
  }
}
```

#### 3. HintFactory の拡張

```typescript
// src/dsl/hint_factory.ts
export class HintFactory {
  /**
   * 特定のコンテナに対してレイアウト制約が適用されているかチェック
   */
  hasDiagramLayoutConstraints(containerId: ContainerSymbolId): boolean {
    return this.layout.constraints.hasConstraintsFor(containerId)
  }
}
```

#### 4. LayoutConstraints の拡張

```typescript
// src/layout/layout_constraints.ts
export class LayoutConstraints {
  /**
   * 特定のコンテナに対して制約が登録されているかチェック
   */
  hasConstraintsFor(containerId: ContainerSymbolId): boolean {
    return this.constraintMap.some(c => 
      c.type === "encloseGrid" || 
      c.type === "encloseFigure" &&
      // metadata から containerId をチェック
      c.metadata?.containerId === containerId
    )
  }
}
```

### 使用例

```typescript
TypeDiagram("System Architecture")
  .use(UMLPlugin)
  .build((el, rel, hint, diagram) => {  // ← diagram 追加
    const frontend = el.core.rectangle("Frontend")
    const backend = el.core.rectangle("Backend")
    const database = el.core.rectangle("Database")
    
    // Diagram 全体を Grid レイアウト
    hint.grid(diagram)
      .enclose([[frontend], [backend, database]])
      .gap({ row: 40, col: 60 })
      .layout()
    
    // 関係線
    rel.core.arrow(frontend, backend)
    rel.core.arrow(backend, database)
  })
  .render("architecture.svg")
```

## 次のステップ

1. ✅ この設計案を確定
2. ⏭️ 実装開始
   - `IntelliSenseBlock` の型定義変更
   - `DiagramBuilder.build()` の変更
   - `HintFactory` の拡張
   - `LayoutConstraints` の拡張
3. ⏭️ テスト追加
4. ⏭️ ドキュメント更新
5. ⏭️ example 追加

## 補足: 破壊的変更の回避

第4引数 `diagram` は省略可能なので、既存コードは影響を受けません:

```typescript
// 既存コード（引数3つ）
TypeDiagram("Title")
  .build((el, rel, hint) => {
    // ... diagram を使わない場合
  })

// 新コード（引数4つ）
TypeDiagram("Title")
  .build((el, rel, hint, diagram) => {
    // ... diagram を使う場合
  })
```

両方とも有効なコードです。
