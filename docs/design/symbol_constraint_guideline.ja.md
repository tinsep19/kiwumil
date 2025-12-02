# シンボル制約作成ガイドライン

## 概要

このドキュメントでは、Kiwumil でシンボルに制約を追加する際の作成ガイドラインと注意事項を説明します。

Kiwumil のレイアウトシステムは [Cassowary](https://constraints.cs.washington.edu/cassowary/) アルゴリズムに基づいており、線形制約のみをサポートしています。

---

## 制約作成時の注意事項

### ⚠️ サポートされない制約タイプ

以下の制約タイプは **サポートされていません**：

| 制約タイプ | 説明 | 例 |
|-----------|------|-----|
| **非線形制約** | 変数の乗算や除算、べき乗を含む制約 | `x * y = 100`, `x² + y² = 100` |
| **条件付き制約** | 条件分岐を含む制約 | `if (x > 50) then y = 100` |
| **論理演算制約** | AND/OR などの論理演算を含む制約 | `x > 0 OR y > 0` |

これらの制約を指定しようとすると、予期しない動作やエラーが発生する可能性があります。

### ✅ サポートされる制約（線形制約のみ）

制約は必ず **線形（一次式）** で記述する必要があります：

```typescript
// ✅ 正しい例：線形制約
builder.expr([1, x]).eq([1, y], [10, 1]).strong()     // x = y + 10
builder.expr([1, x], [2, y]).ge([100, 1]).required()  // x + 2y >= 100
builder.expr([1, width]).ge0().weak()                  // width >= 0

// ❌ 誤った例：非線形制約（サポートされません）
// x * y = 100        ← 変数同士の乗算
// x / y = 2          ← 変数同士の除算
// x² = 100           ← べき乗
```

### 特殊な表現が必要な場合の対処法

非線形や条件付きの表現が必要な場合は、以下のような **構成の工夫** で対応してください：

1. **固定値の事前計算**: 実行前に値を計算し、定数として制約に組み込む
   ```typescript
   // 面積を固定したい場合、事前に幅と高さを計算
   const width = 100
   const height = 50  // 面積5000を維持するよう事前計算
   builder.expr([1, bounds.width]).eq([width, 1]).required()
   builder.expr([1, bounds.height]).eq([height, 1]).required()
   ```

2. **補助変数の導入**: 複雑な関係を複数の線形制約に分解
   ```typescript
   // 比率を維持したい場合
   // width : height = 16 : 9 → 9 * width = 16 * height
   builder.expr([9, bounds.width]).eq([16, bounds.height]).strong()
   ```

3. **制約強度の活用**: 優先順位を設定して柔軟なレイアウトを実現
   ```typescript
   builder.expr([1, bounds.width]).ge([100, 1]).required()  // 最小幅は必須
   builder.expr([1, bounds.width]).eq([200, 1]).weak()      // 理想幅は弱い制約
   ```

---

## 制約作成のベストプラクティス

1. **シンプルに保つ**: 制約は可能な限りシンプルに記述する
2. **強度を適切に設定する**: `required` / `strong` / `medium` / `weak` を目的に応じて使い分ける
3. **競合を避ける**: 矛盾する制約を追加しないよう注意する
4. **派生変数を活用する**: `bounds.right`, `bounds.centerX` などの派生変数を利用してコードを簡潔にする

---

## 関連ドキュメント

- **[Layout System 設計書](./layout-system.ja.md)** - レイアウトシステムの内部実装
- **[Layout Hints API](./layout-hints.ja.md)** - ユーザー向けレイアウトヒント API
- **[Fluent 制約ビルダー移行計画](./fluent-constraint-builder-plan.ja.md)** - 制約ビルダーの設計
