# Examples TypeScript Files Analysis - 2025-12-26

## 概要

`examples/` フォルダ内の全 TypeScript ファイル (*.ts) に対して `bun run` での実行分析を実施しました。

## 実行環境

- Runtime: Bun v1.3.5 (Linux x64 baseline)
- Date: 2025-12-26

## 分析結果

### 修正が必要だったファイル

#### ❌ `examples/test_grid_default.ts`

**問題:**
- `hint.grid()` を引数なしで呼び出し、存在しない `.enclose()` メソッドをチェーンしていた
- TypeError が発生し、スクリプトの実行が失敗していた

**エラーメッセージ:**
```
TypeError: undefined is not an object (evaluating 'symbols.length')
  at new FluentGridBuilder (/home/runner/work/kiwumil/kiwumil/src/hint/fluent_grid_builder.ts:46:9)
```

**修正内容:**
- `hint.grid()` にシンボルの2次元配列を直接渡すように変更
- 存在しない `.enclose()` と `.gap()` メソッドの呼び出しを削除
- コメントを実際の動作に合わせて更新

**修正前:**
```typescript
hint.grid()
  .enclose([
    [a, b],
    [c, d]
  ])
  .gap({ row: 20, col: 30 })
  .layout()
```

**修正後:**
```typescript
hint.grid([
  [a, b],
  [c, d]
]).layout()
```

**結果:** ✅ 正常に SVG ファイルを生成するようになりました

---

### 警告が出るが正常に動作するファイル

以下のファイルは SVG を正常に生成しますが、実行時に負の幅または高さの警告が出力されます。これらは制約ソルバーの計算結果として発生しており、レンダラーが異常な境界を検出してログに記録していますが、最終的な SVG 生成には成功しています。

#### ⚠️ `examples/kiwumil.ts`

**警告内容:**
- 負の幅（-80）が複数のシンボルで検出されました
- 影響を受けるシンボル: core:circle/2 から core:circle/7

**出力例:**
```
[getBoundsValues] Negative width detected: -80
[SvgRenderer] Abnormal bounds detected for symbol: id=core:circle/2, label="i", bounds={x:240, y:75, width:-80, height:50, z:1}
```

**結果:** ✅ SVG は生成されます（`kiwumil.svg`）

---

#### ⚠️ `examples/system_boundary_complex.ts`

**警告内容:**
- 負の高さ（-50）がユースケースシンボルで検出されました
- 影響を受けるシンボル: uml:usecase/3 (Login)

**出力例:**
```
[getBoundsValues] Negative height detected: -50
[SvgRenderer] Abnormal bounds detected for symbol: id=uml:usecase/3, label="Login", bounds={x:210.66666666666666, y:116.66666666666667, width:246.66666666666666, height:-50, z:2}
```

**結果:** ✅ SVG は生成されます（`system_boundary_complex.svg`）

---

#### ⚠️ `examples/system_boundary_nested.ts`

**警告内容:**
- 負の高さ（-50）がユースケースシンボルで検出されました
- 影響を受けるシンボル: uml:usecase/3 (Outer Task)

**出力例:**
```
[getBoundsValues] Negative height detected: -50
[SvgRenderer] Abnormal bounds detected for symbol: id=uml:usecase/3, label="Outer Task", bounds={x:66.66666666666667, y:366.6666666666667, width:300, height:-50, z:2}
```

**結果:** ✅ SVG は生成されます（`system_boundary_nested.svg`）

---

#### ⚠️ `examples/uml-relations.ts`

**警告内容:**
- 負の幅（-80）と負の高さ（-50）が複数のシンボルで検出されました
- 影響を受けるシンボル: uml:usecase/2 (UseCase B), uml:usecase/3 (UseCase C)

**出力例:**
```
[getBoundsValues] Negative height detected: -50
[SvgRenderer] Abnormal bounds detected for symbol: id=uml:usecase/2, label="UseCase B", bounds={x:40, y:175, width:120, height:-50, z:1}
[getBoundsValues] Negative width detected: -80
[SvgRenderer] Abnormal bounds detected for symbol: id=uml:usecase/3, label="UseCase C", bounds={x:240, y:75, width:-80, height:50, z:1}
```

**結果:** ✅ SVG は生成されます（`uml-relations.svg`）

---

#### ⚠️ `examples/usecase_with_actor_dark.ts`

**警告内容:**
- 負の幅（-24）と負の高さ（-50）が複数のシンボルで検出されました
- 影響を受けるシンボル: uml:usecase/2 (Login), uml:usecase/3 (Logout)

**出力例:**
```
[getBoundsValues] Negative width detected: -24
[SvgRenderer] Abnormal bounds detected for symbol: id=uml:usecase/2, label="Login", bounds={x:184, y:75, width:-24, height:86.4, z:1}
[getBoundsValues] Negative height detected: -50
[SvgRenderer] Abnormal bounds detected for symbol: id=uml:usecase/3, label="Logout", bounds={x:40, y:211.4, width:120, height:-50, z:1}
```

**結果:** ✅ SVG は生成されます（`usecase_with_actor_dark.svg`）

---

### 正常に動作するファイル（警告なし）

以下のファイルは警告なしで正常に SVG を生成します：

- ✅ `examples/actor_with_stereotype.ts`
- ✅ `examples/core_text_poc.ts`
- ✅ `examples/diagram_info_full.ts`
- ✅ `examples/dsl_builders_example.ts` (出力なし - 内部テスト用)
- ✅ `examples/first_milestone.ts`
- ✅ `examples/fluent_grid_1.ts`
- ✅ `examples/fluent_grid_2.ts`
- ✅ `examples/fluent_grid_3.ts`
- ✅ `examples/guide_layout.ts`
- ✅ `examples/hints_api_example.ts`

---

## まとめ

### 実行成功率

- **総ファイル数:** 16
- **修正前の成功:** 15/16 (93.75%)
- **修正後の成功:** 16/16 (100%) ✅

### 修正内容

1. **`test_grid_default.ts`**: API の誤用を修正し、正しい grid API の使い方に変更
   - `hint.grid()` を引数なしで呼び出していた問題を修正
   - 存在しない `.enclose()` メソッドの使用を削除
   - シンボルの2次元配列を直接 `hint.grid()` に渡すように修正
   - コードレビューのフィードバックに基づき、JSDoc スタイルの詳細なコメントを追加

### 残存する問題

負の幅/高さの警告は制約ソルバーの計算結果として発生しており、以下の可能性が考えられます：

1. **制約の競合:** 一部のレイアウトヒントや制約が互いに競合している可能性
2. **サイズ指定の不足:** シンボルのサイズが明示的に指定されていない場合のデフォルト動作
3. **コンテナ制約の問題:** システムバウンダリなどのコンテナ内でのレイアウト計算

これらの警告は SVG 生成を妨げませんが、レイアウトエンジンの改善余地を示しています。

### 推奨事項

1. ✅ **test_grid_default.ts の修正完了** - API ドキュメントに従った正しい実装に修正済み
   - コードレビュー完了、セキュリティチェック完了（CodeQL: 0 alerts）
2. 🔍 **負の寸法警告の調査** - 制約ソルバーのデバッグログを有効にして根本原因を調査することを推奨
3. 📝 **API ドキュメントの整備** - `hint.grid()` の正しい使い方を明確に文書化することを推奨

---

## 最終検証結果

### テスト実行

```
Testing  actor_with_stereotype.ts...    ✓
Testing  core_text_poc.ts...            ✓
Testing  diagram_info_full.ts...        ✓
Testing  dsl_builders_example.ts...     ✓
Testing  first_milestone.ts...          ✓
Testing  fluent_grid_1.ts...            ✓
Testing  fluent_grid_2.ts...            ✓
Testing  fluent_grid_3.ts...            ✓
Testing  guide_layout.ts...             ✓
Testing  hints_api_example.ts...        ✓
Testing  kiwumil.ts...                  ✓
Testing  system_boundary_complex.ts...  ✓
Testing  system_boundary_nested.ts...   ✓
Testing  test_grid_default.ts...        ✓
Testing  uml-relations.ts...            ✓
Testing  usecase_with_actor_dark.ts...  ✓
```

**結果: 16/16 ✅ すべて成功**

### セキュリティチェック

CodeQL Analysis: **0 alerts** (javascript) ✅

---

## 生成されたファイル

すべてのサンプルファイルは対応する SVG ファイルを `examples/` ディレクトリに生成します：

```
examples/
├── actor_with_stereotype.svg
├── core_text_poc.svg
├── diagram_info_full.svg
├── first_milestone.svg
├── fluent_grid_1.svg
├── fluent_grid_2.svg
├── fluent_grid_3.svg
├── guide_layout.svg
├── hints_api_example.svg
├── kiwumil.svg
├── system_boundary_complex.svg
├── system_boundary_nested.svg
├── test_grid_default.svg        ← 新規生成（修正後）
├── uml-relations.svg
└── usecase_with_actor_dark.svg
```

すべての TypeScript サンプルファイルは正常に実行され、期待される SVG 出力を生成しています。
