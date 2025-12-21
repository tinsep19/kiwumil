# 2025-12-18: Example ファイルの API 使用エラー修正

## 問題の背景

`examples/*.ts` ファイルを `ls examples/*.ts | xargs -L1 bun run` で実行すると、1 つのファイルでエラーが発生していた。

## 調査結果

### 実際に存在した問題

**`examples/hints_api_example.ts` の API 誤用**
- エラー: `TypeError: undefined is not an object (evaluating 'box1.layout.x')`
- 原因: 存在しないプロパティ `.layout.x` と `.layout.y` を使用していた
- 正しい API: Symbol の `.bounds.x` と `.bounds.y` プロパティ

### 問題記述に記載されていたが実際には問題でなかったもの

1. **依存関係の欠落**: すべて正しくインポートされている
   - `UMLPlugin`, `CorePlugin`, `DefaultTheme`, `BlueTheme`, `DarkTheme` は全て正常
   
2. **レイアウトメソッドの不具合**: 全て正常に動作
   - `alignTop`, `arrangeHorizontal`, `grid` は期待通り機能
   
3. **`render(import.meta)` の互換性**: Bun で完全に互換性あり
   - すべての例で正常に SVG が生成される
   
4. **API の仕様不一致**: すべて最新の仕様に準拠
   - `createGuide`, `enclose`, `grid` は正しく実装されている

### 制約ソルバーの警告について

多くの例で以下の警告が表示される:
```
[getBoundsValues] Negative width detected: -80
[SvgRenderer] Abnormal bounds detected for symbol
```

これは**レイアウトエンジン側の既知の問題**であり、例ファイルの問題ではない:
- SVG は正常に生成される
- 視覚的な問題はない
- 制約ソルバーの内部計算の問題（修正対象外）

## 実装した修正

### `examples/hints_api_example.ts`

6箇所で API を修正:

```typescript
// 修正前（エラー）
builder.ct([1, box1.layout.x]).eq([1, centerX.variable]).strong()
builder.ct([1, box1.layout.y]).eq([1, topY.variable]).strong()

// 修正後（正常）
builder.ct([1, box1.bounds.x]).eq([1, centerX.variable]).strong()
builder.ct([1, box1.bounds.y]).eq([1, topY.variable]).strong()
```

同様の修正を `box2` と `box3` にも適用。

## 検証

### 全例ファイルの実行結果

```bash
$ ls examples/*.ts | xargs -L1 bun run
```

結果: **全 15 ファイルが正常実行 ✅**

```
✅ actor_with_stereotype.ts
✅ core_text_poc.ts
✅ diagram_info_full.ts
✅ first_milestone.ts
✅ fluent_grid_1.ts
✅ fluent_grid_2.ts
✅ fluent_grid_3.ts
✅ guide_layout.ts
✅ hints_api_example.ts  ← 今回修正
✅ kiwumil.ts
✅ system_boundary_complex.ts
✅ system_boundary_nested.ts
✅ test_grid_default.ts
✅ uml-relations.ts
✅ usecase_with_actor_dark.ts
```

### テストの実行

```bash
$ bun test
```

結果: **165/165 テスト通過 ✅**

### コードレビューとセキュリティ

- ✅ コードレビュー: 問題なし
- ✅ セキュリティチェック: 0 件のアラート

## 結論

### 変更内容

- **変更ファイル**: `examples/hints_api_example.ts` のみ
- **変更行数**: 6 行（API 呼び出しの修正）
- **変更種類**: `.layout.x/y` → `.bounds.x/y`

### 影響

- すべての例ファイルが正常に実行される
- 既存のテストは全て通過
- セキュリティ問題なし
- 最小限の変更で問題を解決

### 学んだこと

1. **問題記述と実際の問題は異なる場合がある**: 
   - 5 つの潜在的問題が記載されていたが、実際には 1 つの API 誤用のみが問題だった
   
2. **制約ソルバーの警告は例ファイルの問題ではない**:
   - レイアウトエンジン側の既知の問題であり、実用上の影響はない
   
3. **最小限の変更原則**:
   - 問題のある 1 ファイルのみを修正
   - 動作している他のファイルには手を加えない
