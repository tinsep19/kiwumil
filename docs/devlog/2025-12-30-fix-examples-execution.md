# 作業ログ: examples/*.ts 実行エラーの修正

日付: 2025-12-30  
対象ブランチ: copilot/fix-examples-ts-execution

## 概要

`ls examples/*.ts | xargs -L1 bun run` コマンドが失敗する問題を修正しました。
原因は `examples/hints_api_example.ts` が削除された API を使用していたためです。

さらに、`bun run examples` で同じ内容が実行できるように package.json に npm スクリプトを追加しました。

## 問題の詳細

### エラー内容

```
TypeError: hint.getLayoutContext().hints.createHintVariable is not a function
```

### 原因

`examples/hints_api_example.ts` が以下の削除された API を使用していました：

1. `hint.getLayoutContext().hints.createHintVariable()` - このメソッドは存在しません
2. `hint.getLayoutContext().hints.getHintVariables()` - このメソッドも存在しません

### 背景

- 2025-12-04 に `Hints.createHintVariable()` が実装された（devlog 参照）
- その後、2025-12-27 に UserHintRegistration システムへ移行し、`createHintVariable()` は削除された
- しかし、`examples/hints_api_example.ts` は古い API を使用したままだった

## 修正内容

### 1. examples/hints_api_example.ts の修正

#### 修正方針

削除された API の代わりに、現在サポートされている Guide API を使用するように書き換えました。

#### 修正前（削除された API を使用）

```typescript
// Hints API を使ってカスタムアンカー変数を作成
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
  builder.ct([1, centerX.variable]).eq([300, 1]).required()
})

// Box1 を中央アンカーに左揃え、上アンカーに配置
hint.getLayoutContext().createConstraint("box1/align", (builder) => {
  builder.ct([1, box1.bounds.x]).eq([1, centerX.variable]).strong()
  builder.ct([1, box1.bounds.y]).eq([1, topY.variable]).strong()
})
```

#### 修正後（Guide API を使用）

```typescript
// Guide API を使ってガイドを作成
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
```

#### メリット

1. **動作する API を使用**: `hint.guideX()` と `hint.guideY()` は実装済みで動作する
2. **シンプルなコード**: Guide API は直感的で読みやすい
3. **ドキュメントとの整合性**: 他の例（`guide_layout.ts`）と同じパターンを使用

### 2. package.json への npm スクリプト追加

開発者が簡単に全サンプルを実行できるように、package.json に `examples` スクリプトを追加しました。

```json
"scripts": {
  ...
  "examples": "ls examples/*.ts | xargs -L1 bun run",
  ...
}
```

これにより、以下のコマンドで全サンプルを実行できるようになりました：

```bash
bun run examples
```

## テスト結果

### 個別実行

```bash
bun run examples/hints_api_example.ts
# Saved to /home/runner/work/kiwumil/kiwumil/examples/hints_api_example.svg
# ✅ 正常終了
```

### 全体実行（元のコマンド）

```bash
ls examples/*.ts | xargs -L1 bun run
# ✅ すべてのファイルが正常に実行
# exit code: 0
```

### npm スクリプト経由

```bash
bun run examples
# ✅ すべてのファイルが正常に実行
# exit code: 0
```

### コードレビュー

- 1件の指摘: ガイドの方向性に関するコメントの不明確さ
- 修正済み: ガイドの方向を明確に記述（垂直ガイドライン、水平ガイドライン）

### セキュリティスキャン

- CodeQL: 問題なし（0 alerts）

## 生成されたファイル

- `examples/hints_api_example.svg`: 正常に生成されることを確認

## 変更ファイル一覧

1. `examples/hints_api_example.ts` - API を修正
2. `package.json` - `examples` スクリプトを追加
3. `docs/devlog/2025-12-30-fix-examples-execution.md` - この作業ログ

## 関連ドキュメント

- `docs/devlog/2025-12-04-hints-createHintVariable-implementation.md`: 削除された API の実装記録
- `docs/devlog/2025-12-27-user-hint-registration.md`: UserHintRegistration への移行記録
- `docs/design/layout-hints.ja.md`: 現在の Hints API の設計仕様

## 次のステップ

特になし。すべての examples ファイルが正常に実行される状態になり、開発者が簡単に実行できるようになりました。

## 教訓

- Example ファイルは API 変更時に更新が必要
- CI/CD で examples の実行チェックを追加することを検討すべき（`bun run examples` を CI に追加）
- 古いドキュメントやサンプルコードは定期的にメンテナンスが必要
- よく使うコマンドは npm スクリプトとして登録すると開発体験が向上する
