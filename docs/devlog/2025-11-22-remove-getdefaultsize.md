# 2025-11-22: Remove abstract getDefaultSize and applyFixedSize

## 概要

`SymbolBase` から抽象メソッド `getDefaultSize()` を削除し、さらに `LayoutContext` から `applyFixedSize()` メソッドも削除することで、シンボルが自己完結的にサイズ制約を管理できるようにした。

## 目的

- `SymbolBase` の API から `getDefaultSize()` を除去
- `LayoutContext` の `applyFixedSize()` メソッドを削除
- シンボルが自分自身でサイズ制約を設定できるようにする
- `SystemBoundarySymbol` と同じパターンに統一し、一貫性を向上
- より柔軟で自己完結的な設計にする

## 実装した変更

### 1. SymbolBase の変更
- `abstract getDefaultSize(): { width: number; height: number }` 宣言を削除
- `LayoutContext` 型をインポート
- `layoutContext` プロパティの型を `Variables | LayoutContext` に拡張
- `protected applyFixedSize(size)` メソッドを追加（サブクラスがコンストラクタで使用）
- `protected isLayoutContext()` 型ガード関数を追加（保守性向上）

### 2. LayoutContext の変更
- `applyFixedSize(symbol, size)` メソッドを完全に削除
- `applyMinSize()` は `SystemBoundarySymbol` が使用しているため保持

### 3. 各シンボルクラスの変更

すべてのシンボルにコンストラクタを追加し、`LayoutContext` を受け取り、自身でサイズ制約を設定:

**Core プラグインシンボル:**
- `CircleSymbol`, `EllipseSymbol`, `RectangleSymbol`, `RoundedRectangleSymbol`
  ```typescript
  constructor(id: SymbolId, label: string, layout: LayoutContext) {
    super(id, label, layout)
    this.applyFixedSize(this.getDefaultSize())
  }
  ```

- `TextSymbol`: 条件付きで適用（`Variables` の場合もサポート）
  ```typescript
  constructor(id: string, info: string | TextInfo, layoutContext?: Variables | LayoutContext) {
    // ...
    this.applySizeIfContext(layoutContext)
  }
  
  private applySizeIfContext(layoutContext?: Variables | LayoutContext) {
    if (layoutContext && 'constraints' in layoutContext) {
      this.applyFixedSize(this.getDefaultSize())
    }
  }
  ```

**UML プラグインシンボル:**
- `ActorSymbol`, `UsecaseSymbol`: Core シンボルと同じパターン

### 4. プラグインファクトリの変更

**before:**
```typescript
circle(label: string): SymbolId {
  const symbol = symbols.register(plugin, 'circle', (symbolId) => {
    const circle = new CircleSymbol(symbolId, label, layout.variables)
    layout.applyFixedSize(circle, circle.getDefaultSize())
    return circle
  })
  return symbol.id
}
```

**after:**
```typescript
circle(label: string): SymbolId {
  const symbol = symbols.register(plugin, 'circle', (symbolId) => {
    const circle = new CircleSymbol(symbolId, label, layout)
    return circle
  })
  return symbol.id
}
```

### 5. テストヘルパーの変更

同様に `layout.variables` → `layout` に変更し、`applyFixedSize` 呼び出しを削除

## 影響範囲の分析

### 既存の実装への影響
- 各シンボル実装は `getDefaultSize()` の実装を保持（オプションに変更）
- シンボルが自身でサイズ制約を管理するようになり、より自己完結的に
- `SystemBoundarySymbol` と同じパターンに統一され、一貫性が向上

### 設計上の利点
1. **自己完結性**: シンボルが自分自身のサイズ制約を管理
2. **一貫性**: すべてのシンボルが同じライフサイクルパターンを採用
3. **簡潔性**: プラグインコードから `applyFixedSize` 呼び出しが不要に
4. **柔軟性**: `TextSymbol` のように、条件付きで制約を適用することも可能
5. **保守性**: 型ガード関数で型チェックロジックを統一

## テスト結果

✅ **すべてのテスト通過**: 66 tests
✅ **ビルド成功**: TypeScript コンパイルエラーなし
✅ **タイプチェック成功**: 型定義も正しく生成
✅ **コードレビュー**: 指摘事項を修正済み
✅ **セキュリティチェック**: CodeQL でアラートなし

## 変更統計

**最初のコミット (8d0037e):**
```
6 files changed, 11 insertions(+), 13 deletions(-)
```

**applyFixedSize 削除 (852e760):**
```
13 files changed, 80 insertions(+), 40 deletions(-)
```

**コードレビュー対応 (355b47a):**
```
2 files changed, 13 insertions(+), 8 deletions(-)
```

## コードレビュー対応

1. ✅ `TextSymbol` の inline import を削除し、トップレベルで `LayoutContext` をインポート
2. ✅ 重複していた型チェックロジックを `applySizeIfContext()` ヘルパーメソッドに抽出
3. ✅ `SymbolBase` に `isLayoutContext()` 型ガード関数を追加
## 今後の検討事項

- サイズが不要なシンボルを作成する場合、`getDefaultSize()` を実装せず、コンストラクタで `applyFixedSize()` を呼ばないことが可能
- 動的にサイズを変更したいシンボルは、別の制約設定パターンを使用できる
- `applyMinSize()` も同様のパターンで各シンボルに移動することも検討可能

## コミット履歴

1. **8d0037e** - "Remove abstract getDefaultSize from SymbolBase"
   - 最初の変更: abstract メソッド削除と呼び出し元更新

2. **d8361bf** - "Add devlog for getDefaultSize removal"
   - devlog 追加

3. **852e760** - "Remove applyFixedSize from LayoutContext, symbols self-manage size constraints"
   - @tinsep19 のフィードバックに基づき applyFixedSize を削除
   - シンボルが自己管理する設計に変更

4. **355b47a** - "Add type guard and extract helper method per code review"
   - コードレビュー指摘事項の対応

Branch: `copilot/remove-getdefaultsize-method`

## ユーザーフィードバック

@tinsep19 からのコメント:
> applyFixedSizeも削除できそうだよね。試してみてもらえる

→ 実装完了。`LayoutContext` から `applyFixedSize()` を削除し、各シンボルが自身で制約を設定するパターンに変更しました。
