# Phase 5: LayoutContext のリファクタリング

**日付**: 2026-01-15  
**Phase**: 5/8  
**担当**: tinsep19

## 実施内容

### 成果物

1. **LayoutContext の実装**
   - `src/core/layout_context.ts`
   - Service Locator パターンを採用
   - サービスを getter で公開: `variableFactory`, `constraintFactory`, `solverEngine`
   - Facade メソッドを削除

2. **createLayoutContext 関数**
   - `src/core/create-layout-context.ts`
   - Diagram ごとに新しい LayoutContext を作成

3. **エクスポートの更新**
   - `src/core/index.ts` に LayoutContext と createLayoutContext を追加

4. **テスト**
   - `tests/core/layout-context.test.ts`
   - `tests/integration/layout-workflow.test.ts`
   - フルワークフローのテスト

## 設計決定

### ✅ Service Locator パターン

**Before (Facade)**:
```typescript
class LayoutContext {
  solve(): void { /* ... */ }
  createConstraint(spec): void { /* ... */ }
  valueOf(variable): number { /* ... */ }
}
```

**After (Service Locator)**:
```typescript
class LayoutContext {
  get variableFactory(): IVariableFactory
  get constraintFactory(): IConstraintFactory
  get solverEngine(): ISolverEngine
}
```

**メリット**:
- 責務が明確（LayoutContext はサービスを提供するだけ）
- 各サービスが独立して拡張可能
- クライアントが必要なサービスを直接使用

### ✅ Facade メソッドの削除

**理由**:
- `solve()`, `createConstraint()`, `valueOf()` はサービスのメソッドを呼ぶだけ
- 中間レイヤーとして価値が低い
- サービスを直接使う方がシンプル

### ✅ Getter でのキャッシュ

```typescript
get variableFactory(): IVariableFactory {
  if (!this._variableFactory) {
    this._variableFactory = this.container.resolve(...)
  }
  return this._variableFactory
}
```

初回アクセス時に解決し、以降はキャッシュを返す。

## テスト結果

すべてのテストが成功:
- Service Locator のテスト: ✅
- フルワークフローのテスト: ✅
- Context の独立性テスト: ✅
- 統合テスト（シンプルな Box レイアウト）: ✅
- 統合テスト（水平配置）: ✅

合計 10 テストケースすべて通過。

## 次の Phase への引き継ぎ

### Phase 6 で使用する成果物

- `LayoutContext` クラス
- `createLayoutContext` 関数
- Service Locator パターン

### 推奨事項

- Application Layer（Use Cases）は LayoutContext を使用
- Use Cases はサービスを直接呼び出す

## 注意事項

- 既存の `src/model/layout_context.ts` とは異なるファイル
- 新しい LayoutContext は `src/core/layout_context.ts` に配置
- 既存の model 層の LayoutContext は今後段階的に更新される予定
