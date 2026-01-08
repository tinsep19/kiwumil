# 2026-01-06: Fluent Builder Type System Investigation

## 概要

ユーザーからの報告により、`fluent_builder_generator.ts` の型システムが壊れていることが判明しました。オプションメソッドの「1回のみ呼び出し可能」という制約を実装しようとして、型が `never` に解決されてしまい、IDE の補完が機能しない状態になっています。

## 調査内容

### 1. ドキュメント調査

以下のファイルを確認：
- `docs/design/fluent-grid-api.md` - FluentGridBuilder の設計書（別システム）
- `docs/devlog/2025-12-18-fluent-grid-api.md` - FluentGridBuilder の実装ログ
- `src/hint/fluent_builder_generator.ts` - ジェネリック Fluent Builder の実装
- `src/core/layout_hint.ts` - Builder型定義（ArrangeBuilder, FlowBuilder, AlignBuilder）
- `tsd/fluent_optional_once.test-d.ts` - 型テスト
- `tests/hint_factory_fluent.test.ts` - ランタイムテスト

**結論**: ジェネリック Fluent Builder 型システムの専用設計書は存在しない。インラインコメントとテストのみ。

### 2. 要件の明確化

コメント（`fluent_builder_generator.ts` 46行目）より：
```typescript
/**
 * - optional: 通常オプション（一回のみ可）
 * - optionalGroup: ORオプション（各グループで最大1回）
 */
```

テスト（`tsd/fluent_optional_once.test-d.ts` 27行目）より：
```typescript
// Second call to gap should NOT work
expectError(step3.gap(20))
```

**要件は明確**: オプションメソッドは最大1回のみ呼び出し可能でなければならない。

### 3. 現在の実装の問題点

#### 問題箇所1: Required メソッドセクション（96-105行目）

```typescript
(T["required"] extends Record<string, Fn>
  ? {
      [K in keyof T["required"] & string]:
        K extends REQ
          ? (...a: Args<T["required"][K]>) =>
              Chain<T, Exclude<REQ, K>, REQG, OPT_CONSUMED, OPTG_LOCKED>
          : never;  // ← ここが問題
    }
  : Record<string, never>)
```

**問題**: `REQ` が `never` になった時点（全必須メソッドを呼び終えた後）、すべてのキー `K` に対して：
```typescript
K extends never ? ... : never
// 常に never になる
```

これにより、Required セクションは `Record<string, never>` になります。

#### 問題箇所2: Intersection の崩壊

```typescript
Chain = 
  Record<string, never> &  // Required (満たされた後)
  { gap: Function } &       // Optional
  { in: Function }          // Terminal
```

TypeScript では `Record<string, never>` と他のレコード型の交差型が `never` に解決される場合があります。これが IDE 補完が壊れる原因です。

### 4. 根本原因

**Pattern**: 満たされた条件のメソッドを `never` にマップする戦略
**結果**: `Record<string, never>` が生成される
**影響**: 交差型全体が `never` に崩壊する可能性

## ユーザーの質問への回答

### Q1: 実装すべきか修正すべきか？

**回答**: **修正（FIX）です**。

要件は明確に定義されています：
- コメントで「一回のみ可」と記載
- テストで2回目の呼び出しがエラーになることを期待

実装は既に存在しますが、TypeScript の型システムの限界により壊れています。

### Q2: 設計書は存在するか？

**回答**: **専用の設計書は存在しません**。

ドキュメントは以下のみ：
- `fluent_builder_generator.ts` のインラインコメント
- `src/core/layout_hint.ts` の使用例
- `tsd/fluent_optional_once.test-d.ts` の型テスト

今回の調査に基づき、`docs/draft/fluent-builder-analysis.md` を作成しました。

### Q3: 既知の問題や制限は？

**回答**: **はい、根本的な問題があります**。

- `K extends REQ ? ... : never` パターンが、要件満たし後にすべてのメソッドを `never` にする
- これにより `Record<string, never>` が生成される
- 交差型の崩壊を引き起こし、Chain 全体が `never` になる
- IDE 補完が完全に機能しなくなる

## 解決策の方向性

### オプション A: キーを `never` にマップせず、除外する（推奨）

```typescript
// 現在:
[K in keyof T["required"]]: K extends REQ ? Method : never

// 修正案:
[K in Extract<keyof T["required"], REQ>]: Method
```

**利点**:
- `never` 値を生成しない
- 交差型の崩壊を回避
- 既存の構造を大きく変えない

### オプション B: 別のパターンを使う

- テンプレートリテラル型
- 判別可能な共用体
- 状態ごとの別クラス

**欠点**: 大規模な変更が必要

### オプション C: 交差型の構造を変更

条件付きで Record セクション全体を含む/除外する。

## 次のステップ

1. ✅ 調査完了、分析ドキュメント作成
2. ⏳ 修正方針の詳細設計
3. ⏳ 実装
4. ⏳ `tsd` テストで検証
5. ⏳ ドキュメント更新

## 技術的メモ

### TypeScript 型システムの落とし穴

```typescript
// 危険なパターン
type Dangerous = Record<string, never>
type Combined = Dangerous & { foo: string }
// Combined が never になる可能性がある

// 安全なパターン
type Safe = { [K in "specificKey"]: never }
type Combined = Safe & { foo: string }
// Combined = { foo: string } になる
```

**教訓**: `Record<string, never>` を避け、具体的なキーリストで `never` を使う。

### Mapped Type のキーフィルタリング

```typescript
// 方法1: Conditional mapping (危険)
type Bad<T, Exclude> = {
  [K in keyof T]: K extends Exclude ? never : T[K]
}
// 問題: never 値が残る

// 方法2: Key filtering (安全)
type Good<T, Keep> = {
  [K in Extract<keyof T, Keep>]: T[K]
}
// 利点: 不要なキーが完全に除外される
```

## 参考資料

- TypeScript Handbook: Conditional Types
- TypeScript Handbook: Mapped Types
- TypeScript GitHub Issues: Intersection with Record<string, never>

## 作成ファイル

- `docs/draft/fluent-builder-analysis.md` - 詳細な分析レポート
- `docs/devlog/2026-01-06-fluent-builder-investigation.md` - この調査ログ

## 最終的な解決策（2026-01-08）

### 問題の再確認

複数回のアプローチを試みたが、以下の問題が継続していた：
- `Extract` を使ったキーフィルタリング → 効果なし
- `UnionToIntersection` でラップ → 効果なし
- `SafeUnionToIntersection` で `never` を `{}` に変換 → 効果なし
- Indexed access パターンの変更 → 効果なし

すべてのアプローチで、Chain 型が依然として `never` に解決されていた。

### 最終解決策: Chain 型の分解

@tinsep19 が提案した解決策は、Chain 型を複数のパート型に分解し、それらを交差型で組み合わせる方法だった。

**キーとなる変更**:

1. **Empty 型の導入**: `type Empty = {}` を一貫して使用
2. **Chain 型の分解**: 単一の大きな交差型を以下のパート型に分割
   - `RequiredPart`
   - `RequiredGroupsPart`
   - `OptionalPart`
   - `OptionalGroupPart`
   - `TerminalPart`
3. **各パート型の独立性**: 各パート型が独自の条件ロジックを持ち、`Empty` を返す
4. **最終的な組み合わせ**: `Chain = RequiredPart & RequiredGroupsPart & OptionalPart & OptionalGroupPart & TerminalPart`

### なぜこれが機能したか

**推測される理由**:

1. **型評価の順序**: TypeScript が各パート型を個別に評価し、その後交差を計算することで、never の伝播を防いだ
2. **Empty の一貫性**: `{}` をインラインで使う代わりに `Empty` 型を使用することで、型の同一性が保たれた
3. **複雑性の分散**: 各パート型が単純な構造を持つことで、TypeScript の型推論が正しく機能した

### 結果

- ✅ すべてのランタイムテスト (223個) がパス
- ✅ すべての型テスト（optional-once を含む）がパス
- ✅ Lint エラーなし
- ✅ ビルド成功
- ✅ Chain 型が正しく解決され、IDE 補完が機能

### 教訓

**TypeScript 型システムの複雑性**:
- 同じロジックでも、構造の違いで型推論の結果が異なる
- 大きな交差型は小さなパート型に分解する方が安全
- `never` の伝播を避けるため、各パート型で明示的に `Empty` を返す

**デバッグのアプローチ**:
- 専門家への相談が重要（複数回のアドバイスで徐々に改善）
- 生成された .d.ts ファイルの確認が有効
- 型の分解とテスト駆動での検証

## 完了

この問題は完全に解決されました。Fluent Builder の型システムは正常に動作し、optional メソッドの「1回のみ呼び出し可能」という制約が正しく実装されています。
