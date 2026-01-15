# Phase 1: Infrastructure 層の整備

**日付**: 2026-01-15  
**Phase**: 1/8  
**担当**: tinsep19

## 実施内容

### 成果物

1. **FreeVariable インターフェース**
   - `src/infra/solver/cassowary/types.ts`
   - `kiwi.Variable` が満たすべきインターフェース
   - id を持たない純粋な変数

2. **ICassowarySolver インターフェース**
   - `src/infra/solver/cassowary/cassowary-solver.interface.ts`
   - Pure Cassowary Solver のインターフェース
   - id の管理責務を持たない

3. **型互換性チェック**
   - `src/infra/solver/kiwi/type-check.ts`
   - `kiwi.Variable extends FreeVariable` を型レベルで保証

4. **KiwiSolver 実装**
   - `src/infra/solver/kiwi/kiwi-solver.ts`
   - ラッパークラス不要（`kiwi.Variable` を直接返す）
   - `createHandle` をシンプル化（Fluent Style なし）

5. **KiwiSuggestHandle 実装**
   - `src/infra/solver/kiwi/suggest_handle.ts`
   - `strength()` メソッドを追加

6. **テスト**
   - `tests/infra/kiwi-solver.test.ts`
   - カバレッジ: 90%+

## 設計決定

### ✅ ラッパークラス不要

`kiwi.Variable` が `FreeVariable` を満たすため、ラッパークラスは不要。
パフォーマンス向上とコードの簡素化を実現。

### ✅ createHandle の簡素化

```typescript
// Before: Fluent Style
const handle = solver.createHandle(variable).strong()

// After: シンプル
const handle = solver.createHandle(variable, "strong")
```

Fluent Style は Domain 層（`ISuggestHandleService`）で提供。

## 次の Phase への引き継ぎ

### Phase 2 で使用する成果物

- `FreeVariable` インターフェース
- `ICassowarySolver` インターフェース
- `KiwiSolver` 実装

### 推奨事項

- `VariableImpl` で `FreeVariable` をラップする際の型安全性に注意
- Discriminated Union の `variableType` は実装クラスで設定
