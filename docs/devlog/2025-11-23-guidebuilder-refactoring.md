# 2025-11-23 GuideBuilder 実装の共通化とディレクトリ整理

## 作業内容

GuideBuilderX と GuideBuilderY の重複実装を解消し、共通実装 GuideBuilderImpl を作成しました。さらに、レイアウト関連の Builder ファイルを `src/layout/hint` ディレクトリに移動し、コード構造を改善しました。

## 実施した変更

### 1. 新規ファイル作成: `src/layout/hint/guide_builder.ts` (旧: `src/dsl/guide_builder.ts`)

- GuideBuilderX インターフェイスを定義
- GuideBuilderY インターフェイスを定義
- GuideBuilderImpl クラスを実装
  - コンストラクタで axis ('x' | 'y') パラメータを受け取る
  - 軸に応じて x または y プロパティを設定
  - 軸専用メソッド（alignLeft/Right, alignTop/Bottom など）に実行時チェックを追加
  - 共通メソッド（alignCenter, followCenter, arrange）は軸に応じて動作を切り替え

### 2. 既存ファイル更新: `src/dsl/hint_factory.ts`

- GuideBuilderX/Y クラス実装を削除（約260行削減）
- guide_builder.ts から GuideBuilderImpl と型をインポート
- createGuideX/Y が GuideBuilderImpl を生成し、適切な型で返すように変更

### 3. テスト追加: `tests/guide_builder.test.ts`

包括的なテストスイートを作成：
- GuideBuilderX の全メソッドをテスト
- GuideBuilderY の全メソッドをテスト
- エラーチェック（軸間違い、複数 follow）の動作を確認
- インターフェイス互換性（x/y プロパティ）を検証
- 既存テスト（layout_solver.test.ts）との互換性を確認

### 4. コードレビュー対応

- エラーメッセージから不要な技術的詳細（axis の値）を削除
- より簡潔でユーザーフレンドリーなメッセージに修正

### 5. ディレクトリ構造の整理（追加要件）

Builder ファイルを適切なディレクトリに移動：
- `src/dsl/grid_builder.ts` → `src/layout/hint/grid_builder.ts`
- `src/dsl/figure_builder.ts` → `src/layout/hint/figure_builder.ts`
- `src/dsl/guide_builder.ts` → `src/layout/hint/guide_builder.ts`

各ファイルのインポートパスを更新：
- Builder ファイル内部: `../model/*` → `../../model/*`、`../layout/*` → `../*`
- `hint_factory.ts`: `./grid_builder` → `../layout/hint/grid_builder`

これにより以下の構造に改善：
```
src/dsl/
  └── hint_factory.ts      # DSL エントリポイント

src/layout/hint/
  ├── grid_builder.ts      # レイアウト実装
  ├── figure_builder.ts    # レイアウト実装
  └── guide_builder.ts     # レイアウト実装
```

## 検証結果

### TypeScript コンパイル
- ✅ `npx tsc --noEmit` エラーなし

### リント
- ✅ `npm run lint` 成功（既存の警告のみ）

### フォーマット
- ✅ `npm run format` 実行済み

### セキュリティチェック
- ✅ CodeQL チェック完了、アラート 0件

## 技術的な決定事項

### 1. インターフェイス vs クラス

GuideBuilderX/Y をインターフェイスとして定義することで：
- 既存コードの型互換性を完全に保持
- 実装の詳細を隠蔽
- 将来的な実装変更の柔軟性を確保

### 2. 実行時エラーチェック

TypeScript の型システムでは GuideBuilderImpl が両方のインターフェイスを実装しているため、コンパイル時に軸の誤用を防げません。そのため、実行時に明示的なチェックを追加：

```typescript
private ensureAxisIs(expectedAxis: Axis, method: string) {
  if (this.axis !== expectedAxis) {
    throw new Error(...)
  }
}
```

これにより、開発時にすぐに問題を発見できます。

### 3. arrange メソッドの動作

X軸ガイドと Y軸ガイドで arrange の動作が逆になる点に注意：
- X軸ガイド: 垂直方向に配置（Y座標を調整）
- Y軸ガイド: 水平方向に配置（X座標を調整）

この動作は元の実装を完全に再現しています。

## 改善点

1. **コードの重複削減**: 約260行のコード削減
2. **保守性の向上**: 変更箇所が1つの実装に集約
3. **テストカバレッジの向上**: 包括的なテストスイート追加
4. **型安全性**: インターフェイスによる明確な契約
5. **実行時安全性**: 適切なエラーメッセージによる早期発見
6. **ディレクトリ構造の改善**: DSL 層とレイアウト層の責務を明確に分離
7. **拡張性の向上**: レイアウトロジックが独立し、将来の拡張が容易

## 互換性

- ✅ 既存の API は完全に維持
- ✅ 既存のテスト（layout_solver.test.ts）が引き続き動作
- ✅ 型の互換性は完全に保持
- ✅ 動作は完全に一致

## 今後の課題

特になし。実装は完了し、すべてのチェックをパスしています。

## 参考リソース

- 設計ドキュメント: `docs/design/guide-builder-refactoring.md`
- テストファイル: `tests/guide_builder.test.ts`
- 実装ファイル: `src/layout/hint/guide_builder.ts` (+ grid_builder.ts, figure_builder.ts)
- エントリポイント: `src/dsl/hint_factory.ts`
