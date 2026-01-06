# Grid/Figure Builder の引数省略対応

**作成日:** 2025-11-19  
**関連 Draft:** [2025-11-19-diagram-layout-implementation-plan.md](../draft/2025-11-19-diagram-layout-implementation-plan.md)

## 作業内容

### 背景

Grid/Figure Builder で diagram 全体をレイアウトする際、ユーザーが `DIAGRAM_CONTAINER_ID` をimportする必要があり、DXが良くなかった。

```typescript
// Before: ユーザーが DIAGRAM_CONTAINER_ID をimportする必要があった
import { TypeDiagram, DIAGRAM_CONTAINER_ID } from "kiwumil"

TypeDiagram("Title")
  .layout(({ el, rel, hint }) => {
    hint.grid(DIAGRAM_CONTAINER_ID).enclose([[a, b]]).layout()
  })
```

### 実装した変更

#### 1. HintFactory の引数を省略可能に

`grid()` と `figure()` メソッドの第一引数 `container` を省略可能にし、省略時は `DIAGRAM_CONTAINER_ID` をデフォルト値として使用。

**変更ファイル:**
- `src/dsl/hint_factory.ts`
  - `grid(container?: ContainerSymbolId): GridBuilder`
  - `figure(container?: ContainerSymbolId): FigureBuilder`
  - デフォルト値として `container ?? DIAGRAM_CONTAINER_ID` を使用

#### 2. DIAGRAM_CONTAINER_ID の定義と export

**変更ファイル:**
- `src/model/types.ts`
  - `DIAGRAM_CONTAINER_ID` 定数を追加
  - 値は `"__diagram__"` として `ContainerSymbolId` 型にキャスト
- `src/index.ts`
  - `DIAGRAM_CONTAINER_ID` を export（下位互換のため）

### 使用例

#### 推奨: 引数省略版

```typescript
import { TypeDiagram } from "kiwumil"

TypeDiagram("Title")
  .layout(({ el, rel, hint }) => {
    const a = el.core.rectangle("A")
    const b = el.core.rectangle("B")
    
    // ✅ 引数なしで diagram 全体をレイアウト
    hint.grid()
      .enclose([[a, b]])
      .gap(20)
      .layout()
  })
```

#### 下位互換: 明示的指定版

```typescript
import { TypeDiagram, DIAGRAM_CONTAINER_ID } from "kiwumil"

TypeDiagram("Title")
  .layout(({ el, rel, hint }) => {
    // 明示的に指定することも可能
    hint.grid(DIAGRAM_CONTAINER_ID).enclose([[a, b]]).layout()
  })
```

#### 入れ子コンテナとの併用

```typescript
TypeDiagram("System")
  .layout(({ el, rel, hint }) => {
    const boundary = el.uml.systemBoundary("Cloud")
    const frontend = el.core.rectangle("Frontend")
    const backend = el.core.rectangle("Backend")
    
    // コンテナを明示的に指定
    hint.grid(boundary).enclose([[frontend, backend]]).layout()
    
    const db = el.core.database("DB")
    
    // diagram 全体は引数省略
    hint.grid().enclose([[boundary], [db]]).layout()
  })
```

### 動作確認

`example/test_grid_default.ts` で引数省略版の動作を確認。正常に SVG が生成された。

### メリット

1. **DX の向上**: 最も一般的なユースケース（diagram 全体のレイアウト）がシンプルになった
2. **import の削減**: `DIAGRAM_CONTAINER_ID` をimportする必要がない
3. **下位互換性**: 既存コード（引数付き）もそのまま動作する
4. **一貫性**: コンテナレイアウトと diagram 全体レイアウトの API が統一された

### 影響範囲

- **破壊的変更なし**: 引数付きの呼び出しは従来通り動作
- **新機能追加**: 引数省略が可能になった
- **export 追加**: `DIAGRAM_CONTAINER_ID` が公開 API に追加（オプション）

---

**ステータス:** ✅ 完了（ビルド成功、動作確認済み）
