# Diagram 全体レイアウト実装方針

**作成日:** 2025-11-19  
**ステータス:** ✅ 実装完了（Phase 2 まで完了）  
**devlog:** [2025-11-19-grid-figure-default-container.md](../devlog/2025-11-19-grid-figure-default-container.md)

## 問題の整理

### 現状

Grid/Figure Builder を作成したが、**diagram 全体**のレイアウトを行うことができない。

**原因:**
- DiagramSymbol は `"__diagram__"` という固定IDを持つ
- DiagramSymbol はユーザー定義シンボル作成**後**に生成される（`build()` 内部の後半）
- そのため、callback内で `hint.grid(diagramId)` を呼ぶことができない

### ユーザーの要求

```typescript
TypeDiagram("System Architecture")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    const frontend = el.core.rectangle("Frontend")
    const backend = el.core.rectangle("Backend")
    const database = el.core.rectangle("Database")
    
    // ❌ 現状：これができない（diagramId が存在しない）
    hint.grid(DIAGRAM_CONTAINER_ID)
      .enclose([[frontend], [backend, database]])
      .gap(40)
      .layout()
  })
```

---

## 提案された解決策の比較

### 提案1: DiagramSymbol を callback に第4引数として渡す

**方針:**
- DiagramSymbol を事前生成
- callback に第4引数 `diagram: ContainerSymbolId` を追加

**メリット:**
- シンプル
- 既存の Grid/Figure Builder がそのまま使える

**デメリット:**
- コールバックの引数が増える（4つ）
- DiagramSymbol が空の状態で存在する期間がある

---

### 提案2: DIAGRAM_CONTAINER_ID を export する

**方針:**
- `DIAGRAM_CONTAINER_ID` という定数を export
- DiagramSymbol を事前生成
- ユーザーは `hint.grid(DIAGRAM_CONTAINER_ID)` で参照

**メリット:**
- ✅ コールバックの引数を増やさない
- ✅ 明示的で分かりやすい
- ✅ 既存コードとの互換性を維持
- ✅ Grid/Figure Builder の使い方が統一される

**デメリット:**
- DiagramSymbol の構築フローが複雑になる（軽微）
- ❌ ユーザーが `DIAGRAM_CONTAINER_ID` をimportする必要がある（DXが良くない）

---

### 提案3: grid() / figure() の引数を省略可能にする（最終採用案）

**方針:**
- `grid()` / `figure()` の第一引数 `container` を**省略可能**にする
- 省略された場合は **`DIAGRAM_CONTAINER_ID`** をデフォルト値として使用
- `DIAGRAM_CONTAINER_ID` の export は内部実装のため残すが、ユーザーは使わない

**シグネチャ:**
```typescript
class HintFactory {
  grid(container?: ContainerSymbolId): GridBuilder
  figure(container?: ContainerSymbolId): FigureBuilder
}
```

**メリット:**
- ✅ ユーザーが `DIAGRAM_CONTAINER_ID` をimportする必要がない
- ✅ DXが大幅に向上（最も一般的なケースがシンプルになる）
- ✅ コールバックの引数を増やさない
- ✅ 既存コードとの互換性を維持（引数付きも使える）
- ✅ Grid/Figure Builder の使い方が統一される

**デメリット:**
- なし（提案2の全メリットを含み、デメリットを解消）

---

## 採用する実装方針：提案3（引数省略可能化）

### キーポイント

1. **DIAGRAM_CONTAINER_ID を export**
   - ユーザーが明示的に参照できる
   - `"__diagram__"` を定数化

2. **DiagramSymbol を事前生成**
   - `build()` の最初に DiagramSymbol を作成
   - ただし制約適用は遅延（`deferConstraints: true`）

3. **明示的レイアウト追跡**
   - Grid/Figure Builder が使われたら、デフォルトの enclose 制約を適用しない
   - `LayoutContext` に状態を記録

4. **制約の重複は問題ない**
   - ユーザーが `hint.grid(DIAGRAM_CONTAINER_ID)` を使った場合
   - 内部で `enclose()` が呼ばれる
   - その後、デフォルトの `hint.enclose(DIAGRAM_CONTAINER_ID, allSymbols)` は**スキップ**される
   - → 制約が重複しないため、競合しない

---

## 実装詳細

### 1. DIAGRAM_CONTAINER_ID の export

```typescript
// src/model/types.ts
export const DIAGRAM_CONTAINER_ID = "__diagram__" as ContainerSymbolId
```

```typescript
// index.ts に追加（内部実装用。ユーザーは使わない）
export { DIAGRAM_CONTAINER_ID } from "./model/types"
```

---

### 2. HintFactory の grid() / figure() シグネチャ変更

```typescript
// src/dsl/hint_factory.ts
import { DIAGRAM_CONTAINER_ID } from "../model/types"

export class HintFactory {
  // ✅ container を省略可能に
  grid(container?: ContainerSymbolId): GridBuilder {
    // デフォルト値として DIAGRAM_CONTAINER_ID を使用
    const targetContainer = container ?? DIAGRAM_CONTAINER_ID
    return new GridBuilder(targetContainer, this, this.layoutContext)
  }
  
  figure(container?: ContainerSymbolId): FigureBuilder {
    const targetContainer = container ?? DIAGRAM_CONTAINER_ID
    return new FigureBuilder(targetContainer, this, this.layoutContext)
  }
}
```

---

### 3. DiagramSymbol の遅延制約適用

**現状:**
```typescript
// src/model/diagram_symbol.ts
constructor(id: ContainerSymbolId, titleOrInfo: string | DiagramInfo, layout: LayoutContext) {
  super(id, info.title, layout)
  this.diagramInfo = info
  this.applyDiagramConstraints()  // ← コンストラクタ内で即座に適用
}
```

**変更後:**
```typescript
// src/model/diagram_symbol.ts
constructor(
  id: ContainerSymbolId,
  titleOrInfo: string | DiagramInfo,
  layout: LayoutContext,
  options?: { deferConstraints?: boolean }
) {
  super(id, info.title, layout)
  this.diagramInfo = info
  if (!options?.deferConstraints) {
    this.applyDiagramConstraints()
  }
}

// 公開メソッド化（遅延適用時に外部から呼ぶ）
public applyDiagramConstraints() {
  if (this.constraintsApplied) return
  this.layout.anchorToOrigin(this, LayoutConstraintStrength.Strong)
  this.layout.applyMinSize(this, { width: 200, height: 150 }, LayoutConstraintStrength.Weak)
  this.constraintsApplied = true
}
```

---

### 4. DiagramBuilder の変更

**現状のフロー:**
```typescript
build(callback) {
  const userSymbols = []
  const relationships = []
  
  // 1. LayoutContext を作成
  const layoutContext = new LayoutContext(...)
  
  // 2. callback 実行
  callback(el, rel, hint)
  
  // 3. DiagramSymbol を作成（ここで初めて作られる）
  const diagramSymbol = new DiagramSymbol(...)
  
  // 4. デフォルトの enclose 制約を適用
  hint.enclose(diagramSymbolId, allUserSymbols)
  
  // 5. レイアウト計算
  solver.solve(allSymbols)
}
```

**変更後のフロー:**
```typescript
// src/dsl/diagram_builder.ts
import { DIAGRAM_CONTAINER_ID } from "../model/types"

build(callback: IntelliSenseBlock<TPlugins>) {
  const userSymbols: SymbolBase[] = []
  const relationships: RelationshipBase[] = []
  
  // 1. DiagramSymbol を先に作成（制約は遅延）
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
  
  diagramSymbol = new DiagramSymbol(
    DIAGRAM_CONTAINER_ID,
    this.titleOrInfo,
    layoutContext,
    { deferConstraints: true }  // ← 遅延オプション
  )
  diagramSymbol.setTheme(this.currentTheme)
  
  // 2. Namespace と HintFactory を構築
  const namespaceBuilder = new NamespaceBuilder(this.plugins)
  const el = namespaceBuilder.buildElementNamespace(userSymbols, layoutContext)
  const rel = namespaceBuilder.buildRelationshipNamespace(relationships, layoutContext)
  const hint = new HintFactory(layoutContext, userSymbols)
  
  // 3. callback 実行（ユーザーが hint.grid(DIAGRAM_CONTAINER_ID) を呼べる）
  callback(el, rel, hint)
  
  // 4. ユーザー定義シンボルにテーマを適用
  const allSymbols: SymbolBase[] = [diagramSymbol, ...userSymbols]
  for (const symbol of userSymbols) {
    symbol.setTheme(this.currentTheme)
  }
  for (const relationship of relationships) {
    relationship.setTheme(this.currentTheme)
  }
  
  // 5. デフォルトの enclose 制約を適用（明示的レイアウトがない場合のみ）
  if (userSymbols.length > 0 && !layoutContext.hasExplicitLayoutFor(DIAGRAM_CONTAINER_ID)) {
    hint.enclose(DIAGRAM_CONTAINER_ID, userSymbols.map(s => s.id))
  }
  
  // 6. DiagramSymbol の制約を適用
  diagramSymbol.applyDiagramConstraints()
  
  // 7. レイアウト計算
  const solver = new LayoutSolver(layoutContext)
  solver.solve(allSymbols)
  
  return {
    symbols: allSymbols,
    relationships,
    render: (target: string | ImportMeta | Element) => {
      // ... 既存のレンダリングロジック
    }
  }
}
```

---

### 5. LayoutContext に明示的レイアウト追跡機能を追加

```typescript
// src/layout/layout_context.ts
export class LayoutContext {
  private explicitLayouts = new Set<ContainerSymbolId>()
  
  /**
   * 特定のコンテナに対して明示的レイアウトが指定されたことを記録
   */
  markExplicitLayout(containerId: ContainerSymbolId): void {
    this.explicitLayouts.add(containerId)
  }
  
  /**
   * 特定のコンテナに対して明示的レイアウトが指定されているかチェック
   */
  hasExplicitLayoutFor(containerId: ContainerSymbolId): boolean {
    return this.explicitLayouts.has(containerId)
  }
}
```

---

### 6. Grid/Figure Builder でマーク

```typescript
// src/dsl/grid_builder.ts
export class GridBuilder {
  layout(): void {
    if (!this.matrix) {
      throw new Error('enclose() must be called before layout()')
    }

    const children = this.matrix.flat()

    // metadata 設定
    this.applyContainerMetadata(children)

    // ✅ 明示的レイアウトをマーク
    this.hint.getLayoutContext().markExplicitLayout(this.container)

    // 制約を適用
    this.hint.getLayoutContext().constraints.encloseGrid(this.container, this.matrix, this.options)
  }
}
```

```typescript
// src/dsl/figure_builder.ts
export class FigureBuilder {
  layout(): void {
    if (!this.rows) {
      throw new Error('enclose() must be called before layout()')
    }

    const children = this.rows.flat()

    // metadata 設定
    this.applyContainerMetadata(children)

    // ✅ 明示的レイアウトをマーク
    this.hint.getLayoutContext().markExplicitLayout(this.container)

    // 制約を適用
    this.hint.getLayoutContext().constraints.encloseFigure(this.container, this.rows, this.options)
  }
}
```

---

## 使用例

### 基本的な使い方（引数省略版）

```typescript
import { TypeDiagram } from "kiwumil"
import { UMLPlugin } from "kiwumil/plugin"

TypeDiagram("System Architecture")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    const frontend = el.core.rectangle("Frontend")
    const backend = el.core.rectangle("Backend")
    const database = el.core.rectangle("Database")
    
    // ✅ 引数なしで diagram 全体を Grid レイアウト（推奨）
    hint.grid()
      .enclose([
        [frontend],
        [backend, database]
      ])
      .gap({ row: 40, col: 60 })
      .layout()
    
    rel.core.arrow(frontend, backend)
    rel.core.arrow(backend, database)
  })
  .render("architecture.svg")
```

### 明示的なコンテナ指定版（下位互換）

```typescript
import { TypeDiagram, DIAGRAM_CONTAINER_ID } from "kiwumil"

TypeDiagram("System Architecture")
  .build((el, rel, hint) => {
    const frontend = el.core.rectangle("Frontend")
    const backend = el.core.rectangle("Backend")
    const database = el.core.rectangle("Database")
    
    // ✅ 明示的に DIAGRAM_CONTAINER_ID を指定することも可能
    hint.grid(DIAGRAM_CONTAINER_ID)
      .enclose([
        [frontend],
        [backend, database]
      ])
      .gap({ row: 40, col: 60 })
      .layout()
  })
  .render("architecture.svg")
```

### 複雑な例（入れ子コンテナ）

```typescript
TypeDiagram("Complex System")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    const frontend = el.uml.component("Frontend")
    const backend = el.uml.component("Backend")
    
    const boundary = el.uml.systemBoundary("Cloud")
    // コンテナを明示的に指定
    hint.grid(boundary)
      .enclose([[frontend, backend]])
      .gap(30)
      .layout()
    
    const db = el.core.database("DB")
    
    // ✅ Diagram 全体は引数省略（推奨）
    hint.grid()
      .enclose([
        [boundary],
        [db]
      ])
      .gap(50)
      .layout()
  })
  .render("complex.svg")
```

---

## 制約の重複について

### 質問

> 明示的レイアウト追跡 - Grid/Figure Builderが使われたら、デフォルトのenclose制約を適用しない
> としていますけど、別に制約が重複しても問題ないんですよね?

### 回答

**理論上は重複しても問題ありませんが、避けるべきです。**

#### 理由1: 制約ソルバーの効率

制約が重複すると、kiwi.js ソルバーが処理する制約の数が増え、計算コストが上がります。
また、重複した制約が微妙に異なる強度（Strength）を持つ場合、予期しない挙動を引き起こす可能性があります。

#### 理由2: ユーザーの意図を尊重

ユーザーが明示的に `hint.grid(DIAGRAM_CONTAINER_ID)` を使った場合、
「自分でレイアウトを制御したい」という意図があります。
この場合、デフォルトの `hint.enclose(DIAGRAM_CONTAINER_ID, allSymbols)` は不要です。

#### 理由3: デバッグの容易性

制約が重複すると、どの制約が実際に効いているのか分かりにくくなります。
明示的レイアウトの場合はデフォルト制約を適用しないことで、制約の責任範囲が明確になります。

### 結論

**制約の重複は技術的には可能だが、避けるべき。**

- `hasExplicitLayoutFor()` でチェックし、明示的レイアウトがある場合はデフォルト制約をスキップする
- これにより、ユーザーの意図を尊重し、効率的で予測可能なレイアウトを実現

---

## 実装順序

### Phase 1: 基盤整備
1. ✅ `DIAGRAM_CONTAINER_ID` を `src/model/types.ts` に追加
2. ✅ `index.ts` から export
3. ⏭️ `DiagramSymbol` のコンストラクタに `deferConstraints` オプション追加
4. ⏭️ `applyDiagramConstraints()` を public メソッド化

### Phase 2: HintFactory 修正（✅ 完了）
3. ✅ `HintFactory.grid()` の引数を省略可能にする
4. ✅ `HintFactory.figure()` の引数を省略可能にする
5. ✅ デフォルト値として `DIAGRAM_CONTAINER_ID` を使用
6. ✅ 動作確認（example/test_grid_default.ts）

### Phase 3: LayoutContext 拡張
6. ✅ `LayoutContext.markExplicitLayout()` 追加
7. ✅ `LayoutContext.hasExplicitLayoutFor()` 追加

### Phase 4: Builder 修正
8. ✅ `GridBuilder.layout()` で `markExplicitLayout()` を呼ぶ
9. ✅ `FigureBuilder.layout()` で `markExplicitLayout()` を呼ぶ

### Phase 5: DiagramBuilder 修正
10. ✅ `DiagramBuilder.build()` で DiagramSymbol を事前生成
11. ✅ デフォルト enclose の条件分岐追加

### Phase 6: テストとドキュメント
12. ⏭️ テストケース追加
13. ⏭️ example 追加
14. ⏭️ ドキュメント更新

---

## テスト方針

### テストケース

1. **基本的な Grid レイアウト**
   - `hint.grid(DIAGRAM_CONTAINER_ID)` が正しく動作する

2. **デフォルト動作の維持**
   - `hint.grid(DIAGRAM_CONTAINER_ID)` を使わない場合、従来通り全シンボルが enclose される

3. **入れ子コンテナとの併用**
   - Diagram 全体と個別のコンテナの両方で Grid/Figure Builder を使える

4. **制約の競合がないこと**
   - 明示的レイアウトとデフォルト enclose が同時に適用されない

---

## 関連ファイル

### 修正対象
- `src/model/types.ts` - DIAGRAM_CONTAINER_ID の定義
- `src/model/diagram_symbol.ts` - コンストラクタオプション追加
- `src/dsl/hint_factory.ts` - **grid() / figure() の引数を省略可能にする**
- `src/dsl/diagram_builder.ts` - DiagramSymbol 事前生成
- `src/layout/layout_context.ts` - 明示的レイアウト追跡
- `src/dsl/grid_builder.ts` - markExplicitLayout() 呼び出し
- `src/dsl/figure_builder.ts` - markExplicitLayout() 呼び出し
- `index.ts` - DIAGRAM_CONTAINER_ID の export（内部実装用）

### テスト追加
- `tests/layout/diagram_layout.test.ts` (新規)

### ドキュメント更新
- `docs/design/layout-system.md` - DIAGRAM_CONTAINER_ID の説明追加
- `docs/design/namespace-dsl.md` - 使用例追加

---

## 次のアクション

1. この実装方針をレビュー・承認
2. Phase 1 から順次実装
3. 各 Phase 完了後に動作確認
4. 最終的に統合テストを実行

---

## 補足: 破壊的変更はなし

この変更は**既存コードに影響を与えません**:

```typescript
// 既存コード（変更不要）
TypeDiagram("Title")
  .build((el, rel, hint) => {
    const a = el.core.circle("A")
    const b = el.core.circle("B")
    // デフォルト動作: diagram が全シンボルを enclose
  })

// 新しい使い方（オプション・推奨）
TypeDiagram("Title")
  .build((el, rel, hint) => {
    const a = el.core.circle("A")
    const b = el.core.circle("B")
    // ✅ 引数なしで diagram 全体をレイアウト
    hint.grid().enclose([[a, b]]).layout()
  })

// 明示的指定も可能（下位互換）
import { DIAGRAM_CONTAINER_ID } from "kiwumil"
TypeDiagram("Title")
  .build((el, rel, hint) => {
    const a = el.core.circle("A")
    const b = el.core.circle("B")
    hint.grid(DIAGRAM_CONTAINER_ID).enclose([[a, b]]).layout()
  })
```

両方とも有効なコードです。
