# 2025-12-27: UserHintRegistration システムの実装

## 作業概要

Hints クラスにユーザー作成レイアウトヒントを管理する UserHintRegistration システムを実装しました。これは SymbolRegistration パターンと同様のアーキテクチャを提供します。

## 実装内容

### 1. UserHintRegistration 型と Builder の追加

**新しい型定義:**
- `UserHintRegistration`: ユーザーヒント登録情報を保持
- `UserHintRegistrationBuilder`: ヒント構築用のビルダークラス

**ファイル:** `src/model/hints.ts`

```typescript
export interface UserHintRegistration {
  id: string
  variables: HintVariable[]
  constraints: LayoutConstraint[]
}

export class UserHintRegistrationBuilder {
  createHintVariable(options?: HintVariableOptions): HintVariable
  createConstraint(constraintId: string, spec: ConstraintSpec): LayoutConstraint
  build(): UserHintRegistration
}
```

### 2. Hints クラスへの登録システム追加

**新しいメソッド:**
- `register()`: ユーザーヒントの登録
- `getAllRegistrations()`: 全登録の取得
- `findRegistrationById()`: ID による登録の検索
- `createConstraintForBuilder()`: Builder 用制約作成ヘルパー

**実装の特徴:**
- SymbolRegistration と同様のファクトリーパターン
- 自動 ID 生成 (`hint:{name}/{index}`)
- 登録済みヒントの索引管理

### 3. ヒントビルダーヘルパー関数の作成

**新しいモジュール:** `src/dsl/hint_builder_helpers.ts`

共通レイアウトパターン用のファクトリー関数を提供:

**配置関数:**
- `createArrangeHorizontalConstraint`
- `createArrangeVerticalConstraint`

**整列関数:**
- `createAlignLeftConstraint` / `Right` / `Top` / `Bottom`
- `createAlignCenterXConstraint` / `CenterY`
- `createAlignWidthConstraint` / `Height`

**コンテナ関数:**
- `createEncloseConstraint`

**ガイド関数:**
- `createGuideValueConstraint`

### 4. テストの作成

**テストファイル:**
- `tests/user_hint_registration.test.ts`: 基本的な登録システムのテスト
- `tests/hint_builder_helpers.test.ts`: ヘルパー関数のテスト

**テストカバレッジ:**
- 基本的な登録と検索
- 複数登録の管理
- 制約の機能性検証
- 空ターゲットのハンドリング
- ヘルパー関数の組み合わせ

## 設計判断

### 1. 責任の分離

- **Hints クラス**: 状態管理と低レベル API
- **UserHintRegistrationBuilder**: ヒント固有のファクトリーメソッド
- **Hint Builder Helpers**: 高レベルのパターンファクトリー

### 2. 後方互換性の維持

既存の API を完全に保持:
- `createHintVariable()` は引き続き使用可能
- `arrangeHorizontal()`, `alignLeft()` などのメソッドも維持
- 新旧 API の混在が可能

### 3. SymbolRegistration との一貫性

| SymbolRegistration | UserHintRegistration |
|-------------------|---------------------|
| `Symbols.register()` | `Hints.register()` |
| `SymbolRegistrationBuilder` | `UserHintRegistrationBuilder` |
| `SymbolRegistration` | `UserHintRegistration` |

## 使用例

```typescript
// 基本的な登録
const registration = context.hints.register("custom-guide", (builder) => {
  const guideX = builder.createHintVariable({ baseName: "guide_x", name: "custom" })
  builder.createConstraint("init", (cb) => {
    cb.ct([1, guideX.variable]).eq([150, 1]).strong()
  })
  return builder.build()
})

// ヘルパー関数を使用
context.hints.register("layout", (builder) => {
  createArrangeHorizontalConstraint(builder, targets, 20, "arrange")
  createAlignLeftConstraint(builder, targets, "align")
  return builder.build()
})
```

## テスト結果

全テスト成功:
- 233 pass
- 2 skip
- 0 fail

ビルド・型チェック・リンティングすべて成功。

## ドキュメント

新しいドキュメント作成:
- `docs/design/user-hint-registration.md`: 詳細な設計ドキュメント

## 今後の展開

1. HintFactory への統合（オプション）
2. より多くのヘルパー関数の追加
3. 実例の追加
4. パフォーマンス最適化の検討

## メモ

- ヘルパー関数は UserHintRegistrationBuilder と組み合わせて使用
- 既存コードへの影響なし（100% 後方互換）
- TypeScript の型推論が完全に機能
- 問題なく既存テストすべてパス
