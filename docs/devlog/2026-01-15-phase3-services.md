# Phase 3: Domain Services の実装

**日付**: 2026-01-15  
**Phase**: 3/8  
**担当**: tinsep19

## 実施内容

### 成果物

1. **IVariableFactory インターフェース**
   - `src/domain/interfaces/variable-factory.interface.ts`
   - 型付き変数の生成

2. **IConstraintFactory インターフェース**
   - `src/domain/interfaces/constraint-factory.interface.ts`
   - Discriminated Union 制約の生成

3. **ISolverEngine インターフェース**
   - `src/domain/interfaces/solver-engine.interface.ts`
   - ソルバーの実行

4. **VariableFactory 実装**
   - `src/domain/services/variable-factory.ts`
   - `ICassowarySolver` を使用して `FreeVariable` を作成
   - `VariableImpl` でラップして型を付与

5. **ConstraintFactory 実装**
   - `src/domain/services/constraint-factory.ts`
   - 適切な `category` を設定した制約を生成

6. **SolverEngine 実装**
   - `src/domain/services/solver-engine.ts`
   - `ICassowarySolver.updateVariables()` を呼び出すだけのシンプルな実装

7. **テスト**
   - `tests/domain/services/*.test.ts`
   - 各サービスの動作確認

## 設計決定

### ✅ Factory Pattern の採用

**メリット**:
- Infrastructure 層（`ICassowarySolver`）への依存を隠蔽
- Domain 層のエンティティ（id + 型情報）を一元的に生成
- テスト時に Mock を注入可能

### ✅ シンプルな実装

**SolverEngine**:
- `updateVariables()` を呼び出すだけ
- 将来的に拡張可能（ソルバーの状態管理、エラーハンドリングなど）

**ConstraintFactory**:
- Discriminated Union の各カテゴリに対応したメソッド
- 型安全（`GeometricConstraint` は `required` のみ）

### ✅ ESLint ルールの遵守

**ディレクトリエントリーポイントからのインポート**:
- `src/domain/entities/index.ts` を作成
- すべてのインポートをディレクトリエントリーポイント（index.ts）経由に変更
- カスタムルール `local/require-directory-index-import` に準拠

**SolverEngine**:
- `updateVariables()` を呼び出すだけ
- 将来的に拡張可能（ソルバーの状態管理、エラーハンドリングなど）

**ConstraintFactory**:
- Discriminated Union の各カテゴリに対応したメソッド
- 型安全（`GeometricConstraint` は `required` のみ）

### ✅ テストでの FreeVariable の使用

テストでは、`Variable` オブジェクトではなく、その `freeVariable` プロパティを制約ビルダーに渡す必要があります：

```typescript
// ❌ 間違い: Variable オブジェクトを直接渡す
builder.ct([1, x]).eq([100, 1]).required()

// ✅ 正しい: FreeVariable を渡す
builder.ct([1, x.freeVariable]).eq([100, 1]).required()
```

これは、`KiwiConstraintBuilder` が純粋な `FreeVariable`（`kiwi.Variable`）を期待するためです。

## 除外事項

**SuggestHandleService**:
- 後の Phase で実装予定
- Fluent Style の API を提供するサービス

## テスト結果

```
✓ VariableFactory > should create generic variable
✓ VariableFactory > should create typed variables
✓ VariableFactory > should create variables with working freeVariable
✓ VariableFactory > should create typed variable using createTyped

✓ ConstraintFactory > createGeometric > should create geometric constraint with required strength
✓ ConstraintFactory > createHint > should create layout hint with strong strength
✓ ConstraintFactory > createHint > should support all hint strengths
✓ ConstraintFactory > createHint > should support all hint types
✓ ConstraintFactory > createSymbolInternal > should create symbol internal constraint

✓ SolverEngine > should solve constraints and update variables
✓ SolverEngine > should solve multiple constraints

Total: 264 pass, 2 skip, 0 fail
```

## 品質チェック

### ✅ Lint チェック

```bash
npm run lint
# ✓ No errors found
```

**修正内容**:
- `src/domain/entities/index.ts` を作成し、エンティティを再エクスポート
- すべてのインポートをディレクトリエントリーポイント経由に変更
- カスタムルール `local/require-directory-index-import` に準拠

### ✅ 型チェック

```bash
tsc --noEmit
# ✓ No errors found
```

## 次の Phase への引き継ぎ

### Phase 4 で使用する成果物

- `IVariableFactory`, `IConstraintFactory`, `ISolverEngine` インターフェース
- 各実装クラス

### 推奨事項

- DI Container で各サービスを登録
- LayoutContext が各サービスを保持
- **各 Phase の完了時に必ず lint チェックを実施**（`npm run lint`）

## 各フェーズの検証チェックリスト

今後のすべての Phase で以下のチェックを実施すること：

1. **✅ テスト実行**: `npm test` - すべてのテストがパス
2. **✅ 型チェック**: `tsc --noEmit` - TypeScript エラーなし
3. **✅ Lint チェック**: `npm run lint` - ESLint エラーなし
4. **✅ コードレビュー**: 自動レビューツールで確認

## ファイル構成

```
src/
  domain/
    interfaces/
      variable-factory.interface.ts       # IVariableFactory
      constraint-factory.interface.ts     # IConstraintFactory
      solver-engine.interface.ts          # ISolverEngine
      index.ts                            # 再エクスポート
    services/
      variable-factory.ts                 # VariableFactory 実装
      constraint-factory.ts               # ConstraintFactory 実装
      solver-engine.ts                    # SolverEngine 実装
      index.ts                            # 再エクスポート
    entities/
      variable.ts                         # Variable Discriminated Union (Phase 2)
      layout-constraint.ts                # LayoutConstraint Discriminated Union (Phase 2)
      index.ts                            # 🆕 再エクスポート（Lint 対応）

tests/
  domain/
    services/
      variable-factory.test.ts
      constraint-factory.test.ts
      solver-engine.test.ts

docs/
  devlog/
    2026-01-15-phase3-services.md        # このファイル
```
