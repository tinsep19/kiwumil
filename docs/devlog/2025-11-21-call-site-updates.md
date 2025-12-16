# 2025-11-21 呼び出し元の更新（移行手順 6）

## 背景

[docs/draft/kiwi-boundary-refactor.md](../draft/kiwi-boundary-refactor.md) の移行手順 6 を検討。

移行手順 6 の元の方針：「既存の variables.addConstraint / variables.solve を context.addConstraint / context.solve に置き換えていく」

## 現状の分析

### 移行手順 1-5 の結果

移行手順 1-5 により、以下のアーキテクチャが確立されている：

```typescript
LayoutContext
  ├── solver: KiwiSolver (所有)
  ├── vars: LayoutVariables (solver を注入)
  └── constraints: LayoutConstraints (vars を使用)
```

### solve() の呼び出し

#### 現在の実装
```typescript
// src/kiwi/layout_context.ts
export class LayoutContext {
  private readonly solver: KiwiSolver
  
  solve() {
    this.solver.updateVariables()  // ✅ 直接 solver を呼び出し
  }
}
```

**状態**: ✅ **既に移行済み**
- `context.solve()` は直接 `this.solver.updateVariables()` を呼び出し
- `vars.solve()` を経由していない
- 移行手順 4 で既に完了

### addConstraint の呼び出し

#### 現在の使用箇所

LayoutConstraints が `this.variables.addConstraint()` を使用：
```typescript
// src/kiwi/layout_constraints.ts
export class LayoutConstraintBuilder {
  eq(left, right, strength) {
    this.raws.push(
      this.variables.addConstraint(left, operator, right, strength)
    )
    return this
  }
}

export class LayoutConstraints {
  arrangeHorizontal(symbolIds, gap) {
    const raws: kiwi.Constraint[] = []
    
    for (...) {
      raws.push(
        this.variables.addConstraint(...)
      )
    }
    
    this.record("arrangeHorizontal", raws)
  }
}
```

#### この設計が適切な理由

1. **LayoutConstraints は vars を受け取る**
   ```typescript
   constructor(
     private readonly vars: LayoutVariables,
     private readonly theme: Theme,
     private readonly resolveSymbol: (id: LayoutSymbolId) => SymbolBase | undefined
   ) {}
   ```

2. **vars は solver を注入されている**
   ```typescript
   // LayoutContext のコンストラクタ
   this.solver = new KiwiSolver()
   this.variables = new LayoutVariables(this.solver)
   this.constraints = new LayoutConstraints(this.variables, theme, resolveSymbol)
   ```

3. **データフロー**
   ```
   LayoutConstraints
     └─→ vars.addConstraint()
           └─→ solver.addConstraint()
                 └─→ kiwi.Solver (LayoutContext が所有)
   ```

この設計により：
- LayoutConstraints は vars に依存（適切な抽象化レベル）
- vars は solver に依存（依存性注入済み）
- solver は LayoutContext が所有（ライフサイクル管理）

### context.addConstraint() を追加する必要性の検討

#### 追加するとしたら
```typescript
export class LayoutContext {
  addConstraint(
    left: LayoutExpressionInput,
    operator: Operator,
    right: LayoutExpressionInput,
    strength?: Strength
  ) {
    return this.solver.addConstraint(left, operator, right, strength)
  }
}
```

#### 追加しない理由

1. **既存の API で十分機能している**
   - `constraints.arrangeHorizontal()` などの高レベル API が存在
   - 直接制約を追加する必要があるケースは `constraints.withSymbol()` でカバー可能

2. **LayoutConstraints の責務を尊重**
   - LayoutConstraints が制約生成のロジックを持つ
   - Context が直接制約追加 API を持つと、責務が曖昧になる

3. **現在の設計は階層的で明確**
   ```
   高レベル: LayoutContext (オーケストレーション)
   中レベル: LayoutConstraints (制約生成ロジック)
   低レベル: LayoutVariables (変数管理)
   実装:     KiwiSolver (solver ラッパー)
   ```

4. **必要な場合は `context.variables.addConstraint()` で可能**
   - vars は public フィールド
   - 必要に応じて直接アクセス可能
   - 通常は constraints 経由の方が適切

## 実施した確認

### テストの実行
```bash
$ bun test
 66 pass
 0 fail

$ bun run test:types
# 型テストも成功
```

すべてのテストが成功し、アーキテクチャは健全な状態。

### 実際の使用パターンの確認

#### パターン 1: 高レベル API（推奨）
```typescript
const context = new LayoutContext(theme, resolveSymbol)
context.constraints.arrangeHorizontal([id1, id2, id3])
context.solve()
```

#### パターン 2: カスタム制約（必要に応じて）
```typescript
context.constraints.withSymbol(symbol, "symbolBounds", builder => {
  builder.eq(bounds.width, 100)
  builder.eq(bounds.height, 50)
})
context.solve()
```

#### パターン 3: 低レベル API（特殊なケース）
```typescript
const x = context.variables.createVar("x")
context.variables.addConstraint(x, Operator.Eq, 42)
context.solve()
```

すべてのパターンが正常に動作している。

## 評価と結論

### 移行手順 6 の状態：実質的に完了

以下の理由により、移行手順 6 は「実質的に完了」と判断：

1. **solve() は既に移行済み**
   - ✅ `context.solve()` が `this.solver.updateVariables()` を直接呼び出し
   - ✅ `vars.solve()` を経由していない

2. **addConstraint の現在の使用方法が適切**
   - ✅ LayoutConstraints が vars 経由で制約を追加
   - ✅ vars は注入された solver を使用
   - ✅ 責務が明確に分離されている

3. **context.addConstraint() の追加は不要**
   - 既存の高レベル API で十分
   - 必要な場合は `context.variables.addConstraint()` で対応可能
   - 追加すると責務が曖昧になるリスク

4. **アーキテクチャは健全**
   - テストがすべて通過
   - 明確な階層構造
   - 適切な抽象化レベル

### 元の移行計画との整合性

元の計画：「まずは変数・制約作成は従来どおり行い、追加先だけ Context に切り替える」

**実現状況**：
- 変数作成: `context.variables.createVar()` ✅
- 制約作成: `context.constraints.arrangeHorizontal()` など ✅
- 制約追加: vars 経由 → solver (Context 所有) ✅
- solve 実行: `context.solve()` → `this.solver.updateVariables()` ✅

間接的ではあるが、制約は Context が所有する solver に追加されている。これは依存性注入による健全な設計パターン。

## 現在のアーキテクチャの特徴

### 明確な責務分担

| レイヤー | モジュール | 責務 |
|---------|-----------|------|
| オーケストレーション | LayoutContext | solver 所有、solve タイミング制御 |
| 制約生成 | LayoutConstraints | 制約ロジック、メタデータ管理 |
| 変数管理 | LayoutVariables | 変数作成、solver への委譲 |
| solver 実装 | KiwiSolver | kiwi.Solver ラッパー |

### データフロー

```
使用者
  └─→ LayoutContext.solve()
        └─→ solver.updateVariables()

  └─→ LayoutContext.constraints.arrangeHorizontal()
        └─→ vars.addConstraint()
              └─→ solver.addConstraint()
```

solver の所有権が Context にあるため、すべての操作が Context を起点とする健全な設計。

## 次のステップ

移行手順の残り：
1. ✅ kiwi ラッパーを作成（完了）
2. ✅ 型の切り出し（完了）
3. ✅ LayoutVariables を依存注入対応にする（完了）
4. ✅ LayoutContext に Solver を移動（完了）
5. ✅ LayoutConstraints の責務整理（実質的に完了）
6. ✅ 呼び出し元の更新（実質的に完了）
7. ⏳ 副次作業と検証（任意）

**主要な移行目的は完全に達成。ステップ 7 は任意の検証・ドキュメント更新。**
