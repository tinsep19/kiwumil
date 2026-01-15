# Phase 4: DI Container の導入

**日付**: 2026-01-15  
**Phase**: 4/8  
**担当**: tinsep19

## 実施内容

### 成果物

1. **DiContainer クラス**
   - `src/core/di-container.ts`
   - Singleton 登録
   - Factory 登録
   - 依存解決
   - キャッシュ機能（Factory の結果を Singleton 化）

2. **サービストークン**
   - `src/core/service-tokens.ts`
   - 型安全な文字列リテラル

3. **createDiContainer 関数**
   - `src/core/create-di-container.ts`
   - すべてのサービスを登録
   - Diagram スコープの実現

4. **テスト**
   - `tests/core/di-container.test.ts`
   - `tests/core/create-di-container.test.ts`
   - 依存解決、キャッシュ、独立性のテスト

## 設計決定

### ✅ 軽量 DI Container

**特徴**:
- シンプルな実装（Map ベース）
- Singleton と Factory の2つの登録方法
- Factory の結果を自動キャッシュ

**メリット**:
- 外部ライブラリ不要
- Diagram スコープを簡単に実現
- テストが容易

### ✅ Diagram スコープ

各 Diagram ごとに新しい Container インスタンスを作成：

```typescript
const diagram1Container = createDiContainer()
const diagram2Container = createDiContainer()

// diagram1 と diagram2 は独立したサービスを持つ
```

### ✅ サービストークン

型安全な文字列リテラル：

```typescript
const SERVICE_TOKENS = {
  CASSOWARY_SOLVER: "ICassowarySolver",
  VARIABLE_FACTORY: "IVariableFactory",
  // ...
} as const
```

## 次の Phase への引き継ぎ

### Phase 5 で使用する成果物

- `DiContainer` クラス
- `createDiContainer` 関数
- `SERVICE_TOKENS`

### 推奨事項

- LayoutContext が DiContainer を保持
- LayoutContext のメソッドは内部で `container.resolve()` を呼び出す
- Service Locator パターンとして機能
