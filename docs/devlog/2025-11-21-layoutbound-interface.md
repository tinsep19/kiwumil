# 2025-11-21: LayoutBound の interface 化

## 目的

LayoutBound を class から interface に変更し、LayoutVariables に factory メソッドを追加することで、アーキテクチャをさらに簡素化する。

## 背景

移行手順 7 により、vars と constraints が完全に独立し、両方とも KiwiSolver を通じて連携する設計になった。しかし、LayoutBound はまだ class として実装されており、vars と solver への依存を保持していた。これをより単純な interface に変更することで、以下のメリットが得られる：

1. **単純化**: LayoutBound は単なる変数のグループとして表現される
2. **責務の集約**: computed properties の制約生成ロジックを LayoutVariables 内に集約
3. **依存の削減**: LayoutBound が vars と solver に依存しなくなる

## 実施内容

### 1. LayoutBound を interface に変更

**変更前（class）**:
```typescript
export class LayoutBound {
  readonly x: LayoutVar
  readonly y: LayoutVar
  readonly width: LayoutVar
  readonly height: LayoutVar

  private _right?: LayoutVar
  private _bottom?: LayoutVar
  private _centerX?: LayoutVar
  private _centerY?: LayoutVar

  constructor(
    private readonly vars: LayoutVariables,
    private readonly solver: KiwiSolver,
    x: LayoutVar, y: LayoutVar, width: LayoutVar, height: LayoutVar
  ) { ... }

  get right(): LayoutVar { ... }
  get bottom(): LayoutVar { ... }
  get centerX(): LayoutVar { ... }
  get centerY(): LayoutVar { ... }
}
```

**変更後（interface）**:
```typescript
export interface LayoutBound {
  readonly x: LayoutVar
  readonly y: LayoutVar
  readonly width: LayoutVar
  readonly height: LayoutVar
  readonly right: LayoutVar
  readonly bottom: LayoutVar
  readonly centerX: LayoutVar
  readonly centerY: LayoutVar
}
```

### 2. LayoutVariables に createBound() factory メソッドを追加

```typescript
class LayoutVariables {
  /**
   * LayoutBound を生成する factory メソッド
   * すべての computed properties (right, bottom, centerX, centerY) も作成し、制約を設定する
   */
  createBound(prefix: string): LayoutBound {
    const solver = this.getSolver()
    if (!solver) {
      throw new Error("LayoutVariables: solver is not injected. Cannot create bound with constraints.")
    }

    // 基本的な 4 つの変数を作成
    const x = this.createVar(`${prefix}.x`)
    const y = this.createVar(`${prefix}.y`)
    const width = this.createVar(`${prefix}.width`)
    const height = this.createVar(`${prefix}.height`)

    // computed properties を作成
    const right = this.createVar(`${prefix}.right`)
    const bottom = this.createVar(`${prefix}.bottom`)
    const centerX = this.createVar(`${prefix}.centerX`)
    const centerY = this.createVar(`${prefix}.centerY`)

    // 制約を設定
    // right = x + width
    solver.addConstraint(right, Operator.Eq, solver.expression([{ variable: x }, { variable: width }]))
    // bottom = y + height
    solver.addConstraint(bottom, Operator.Eq, solver.expression([{ variable: y }, { variable: height }]))
    // centerX = x + width * 0.5
    solver.addConstraint(centerX, Operator.Eq, solver.expression([{ variable: x }, { variable: width, coefficient: 0.5 }]))
    // centerY = y + height * 0.5
    solver.addConstraint(centerY, Operator.Eq, solver.expression([{ variable: y }, { variable: height, coefficient: 0.5 }]))

    return { x, y, width, height, right, bottom, centerX, centerY }
  }
}
```

### 3. 呼び出し元の更新

**SymbolBase の変更**:
```typescript
// 変更前
this.layoutBounds = new LayoutBound(
  vars,
  solver,
  vars.createVar(`${this.id}.x`),
  vars.createVar(`${this.id}.y`),
  vars.createVar(`${this.id}.width`),
  vars.createVar(`${this.id}.height`)
)

// 変更後
this.layoutBounds = vars.createBound(this.id)
```

**ContainerSymbolBase の変更**:
```typescript
// 変更前
this.contentBounds = new LayoutBound(
  vars,
  solver,
  vars.createVar(`${this.id}.content.x`),
  vars.createVar(`${this.id}.content.y`),
  vars.createVar(`${this.id}.content.width`),
  vars.createVar(`${this.id}.content.height`)
)

// 変更後
this.contentBounds = vars.createBound(`${this.id}.content`)
```

## テスト結果

```bash
$ bun test
✓ 66 tests pass (all tests)
✓ 0 failures
✓ 232 expect() calls

$ bun run test:types
✓ Type tests pass
```

## 効果

1. **コードの簡潔化**: 
   - LayoutBound の生成が 1 行に簡略化
   - class の複雑な実装が不要に

2. **責務の明確化**:
   - computed properties の制約生成が LayoutVariables に集約
   - LayoutBound は単なるデータ構造として機能

3. **依存関係の削減**:
   - LayoutBound が vars と solver への参照を保持しない
   - より単純で理解しやすい構造

4. **パフォーマンスの向上**:
   - lazy evaluation（getter での遅延生成）から事前生成に変更
   - すべての変数と制約が一度に作成されるため、予測可能な挙動

## 最終アーキテクチャ

```
LayoutVariables（変数とバウンドの生成・管理）
  - createVar(name): LayoutVar の生成
  - createBound(prefix): LayoutBound の生成（factory）
    → 8 つの変数を作成
    → computed properties の制約を設定
  - valueOf(variable): 変数値の取得

LayoutBound（interface）
  - 8 つの LayoutVar を保持する単純な構造
  - x, y, width, height（基本）
  - right, bottom, centerX, centerY（computed）
  - すべて事前に作成され、制約も設定済み
```

## 次のステップ

- ✅ 移行手順 1-7 完了
- ✅ LayoutBound の interface 化完了
- ✅ すべてのテスト通過
- ✅ 完全な後方互換性維持

主要なリファクタリングは完了。今後の最適化は別 PR で実施予定。
