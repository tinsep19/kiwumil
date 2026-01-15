# Phase 2: Domain 層の整備

**日付**: 2026-01-15  
**Phase**: 2/8  
**担当**: tinsep19

## 実施内容

### 成果物

1. **Variable の Discriminated Union**
   - `src/domain/entities/variable.ts`
   - `variableType` で型を判別（実行時に存在）
   - 6種類: `AnchorX`, `AnchorY`, `AnchorZ`, `Width`, `Height`, `GenericVariable`

2. **LayoutConstraint の Discriminated Union**
   - `src/domain/entities/layout-constraint.ts`
   - `category` で分類: `geometric`, `hint`, `symbol-internal`
   - `GeometricConstraint` は `required` のみ（リテラル型で強制）

3. **Bounds 型の更新**
   - `src/core/layout_variable.ts`
   - 型付き変数を使用: `x: AnchorX`, `width: Width`
   - Discriminated Union として再定義
   - `BaseBounds` を導入し、`LayoutBounds`, `ContainerBounds`, `ItemBounds` を明確化

4. **テスト**
   - `tests/domain/variable.test.ts`
   - `tests/domain/layout-constraint.test.ts`
   - 網羅性チェック、型推論のテスト
   - すべてのテストが通過（253 pass, 2 skip）

## 設計決定

### ✅ Discriminated Union の採用

**Variable**:
- ブランド型から Discriminated Union へ移行
- `variableType` が実行時に存在（デバッグ容易）
- 型ガードで TypeScript の型推論が機能
- `VariableImpl` 実装クラスで `FreeVariable` をラップ

**LayoutConstraint**:
- 制約の役割が明確（幾何的制約 vs ヒント vs Symbol内部）
- `GeometricConstraint` の `strength` は `"required"` のみ（型安全）
- `LayoutHint` は `strong`, `medium`, `weak` をサポート
- `SymbolInternalConstraint` は Symbol ID を保持

### ✅ Bounds の Discriminated Union 化

従来の `Bounds` インターフェースを Discriminated Union として再定義：

```typescript
// Before
export interface Bounds {
  readonly type: BoundsType
  // ...
}

// After
export type Bounds = LayoutBounds | ContainerBounds | ItemBounds

export interface BaseBounds {
  readonly type: BoundsType
  readonly x: AnchorX
  readonly y: AnchorY
  // ...
}

export interface LayoutBounds extends BaseBounds {
  readonly type: "layout"
}

export interface ContainerBounds extends BaseBounds {
  readonly type: "container"
}

export interface ItemBounds extends BaseBounds {
  readonly type: "item"
}
```

この変更により、`type` フィールドで型を判別できるようになり、
Phase 3 以降の実装が容易になる。

### ✅ z のデフォルト値はヒント

Bounds の `z` のデフォルト値（`z = 0`）は幾何的制約ではなく、
`LayoutHint` (category: "hint", strength: "weak") として実装することを推奨。
これにより `enclose` ヒントで上書き可能。

## 型安全性の向上

### 網羅性チェック

Discriminated Union により、switch 文で網羅性チェックが機能：

```typescript
switch (variable.variableType) {
  case "anchor_x":
  case "anchor_y":
  case "anchor_z":
  case "width":
  case "height":
  case "generic":
    // 処理
    break
  default:
    const _exhaustive: never = variable
    throw new Error(`Unhandled type: ${_exhaustive}`)
}
```

### 型推論の改善

Type guards により、型が自動的に絞り込まれる：

```typescript
if (isAnchorX(variable)) {
  // variable は AnchorX 型として扱われる
  console.log(variable.variableType) // "anchor_x"
}
```

## テスト結果

```
✓ Variable Discriminated Union > VariableImpl > should create variable with correct discriminator
✓ Variable Discriminated Union > VariableImpl > should delegate value() to freeVariable
✓ Variable Discriminated Union > VariableImpl > should delegate name() to freeVariable
✓ Variable Discriminated Union > Type Guards > should correctly identify variable types
✓ Variable Discriminated Union > Type Safety with Switch > should maintain type safety in switch statements

✓ LayoutConstraint Discriminated Union > GeometricConstraint > should correctly identify geometric constraints
✓ LayoutConstraint Discriminated Union > GeometricConstraint > should only allow required strength
✓ LayoutConstraint Discriminated Union > LayoutHint > should correctly identify layout hints
✓ LayoutConstraint Discriminated Union > LayoutHint > should support all non-required strengths
✓ LayoutConstraint Discriminated Union > SymbolInternalConstraint > should correctly identify symbol internal constraints
✓ LayoutConstraint Discriminated Union > SymbolInternalConstraint > should require symbolId
✓ LayoutConstraint Discriminated Union > Type Safety with Switch > should maintain type safety in switch statements

Total: 253 pass, 2 skip, 0 fail
```

## 次の Phase への引き継ぎ

### Phase 3 で使用する成果物

- `Variable` Discriminated Union
- `LayoutConstraint` Discriminated Union
- `VariableImpl` 実装クラス
- 更新された `Bounds` 型定義

### 推奨事項

1. **VariableFactory の更新**
   - `VariableImpl` を使用して変数を生成
   - `variableType` を適切に設定

2. **ConstraintFactory の作成**
   - `GeometricConstraint` は幾何的な定義に使用
   - `LayoutHint` はユーザーヒントに使用
   - `SymbolInternalConstraint` は Symbol 内部に使用

3. **z のデフォルト値**
   - `createHint` で `z = 0` を設定
   - strength は `weak` を推奨

## 備考

### 後方互換性

既存の branded types (`AnchorX`, `Width` など) は維持されているため、
既存のコードは引き続き動作する。Phase 3 以降で段階的に移行する。

### ファイル構成

```
src/
  domain/
    entities/
      variable.ts           # Variable Discriminated Union
      layout-constraint.ts  # LayoutConstraint Discriminated Union
  core/
    layout_variable.ts      # 更新された Bounds 型

tests/
  domain/
    variable.test.ts
    layout-constraint.test.ts

docs/
  devlog/
    2026-01-15-phase2-domain.md  # このファイル
```
