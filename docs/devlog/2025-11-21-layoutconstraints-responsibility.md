# 2025-11-21 LayoutConstraints の責務整理（移行手順 5）

## 背景

[docs/draft/kiwi-boundary-refactor.md](../draft/kiwi-boundary-refactor.md) の移行手順 5 を検討。

移行手順 4 まで完了した時点で、以下の状態になっている：
- LayoutContext が KiwiSolver を所有
- LayoutVariables が注入された solver を使用
- LayoutConstraints が LayoutVariables 経由で制約を追加

移行手順 5 の元の方針：「Constraint を『生成して返す』役割に限定し、生成した Constraint を Context が受け取り solver に追加するフローに変更する」

## 現状の分析

### 現在のアーキテクチャ

```typescript
LayoutContext
  ├── solver: KiwiSolver (所有)
  ├── vars: LayoutVariables (solver を注入)
  └── constraints: LayoutConstraints (vars を使用)
```

### LayoutConstraints の現在の実装

#### 1. LayoutConstraintBuilder
```typescript
export class LayoutConstraintBuilder {
  private readonly raws: kiwi.Constraint[] = []
  
  constructor(private readonly vars: LayoutVariables) {}
  
  eq(left, right, strength) {
    this.raws.push(
      this.variables.addConstraint(left, operator, right, strength)
    )
    return this
  }
  
  getRawConstraints() {
    return this.raws
  }
}
```

- `vars.addConstraint()` を呼び出して制約を追加
- 追加された制約オブジェクトを配列に収集
- `getRawConstraints()` で取得可能

#### 2. LayoutConstraints のメソッド
```typescript
arrangeHorizontal(symbolIds, gap) {
  const raws: kiwi.Constraint[] = []
  
  for (...) {
    raws.push(
      this.variables.addConstraint(...)
    )
  }
  
  this.record("arrangeHorizontal", raws)
}
```

- `vars.addConstraint()` を直接呼び出し
- 結果を `raws` 配列に収集
- `record()` メソッドでメタデータとして記録

### 現在の責務分担

| モジュール | 責務 | 実装状況 |
|-----------|------|---------|
| LayoutContext | solver の所有と solve のタイミング制御 | ✅ 完了 |
| LayoutVariables | 変数管理、solver への制約追加の委譲 | ✅ 完了 |
| LayoutConstraints | 制約の生成とメタデータ管理 | ✅ 完了 |
| KiwiSolver | 制約の管理と solver の実行 | ✅ 完了 |

## 評価と判断

### 元の課題は解決済み

移行手順 5 の元の目的は「solver への依存を分離する」ことだったが、移行手順 1-4 で既に達成されている：

1. ✅ **kiwi への依存は集約済み**
   - `src/kiwi/kiwi/` モジュールに集約
   - LayoutConstraints は直接 kiwi に依存していない

2. ✅ **solver の所有権は明確**
   - LayoutContext が所有
   - LayoutVariables、LayoutConstraints は注入された solver を使用

3. ✅ **責務は十分に分離されている**
   - LayoutConstraints: 制約の生成ロジックとメタデータ管理
   - LayoutVariables: 変数管理と制約追加の仲介
   - KiwiSolver: solver の実装とライフサイクル管理
   - LayoutContext: 全体のオーケストレーション

### さらなる分離を行う場合の考察

もし「Constraint を生成するだけで、solver に追加しない」という厳密な分離を行う場合：

#### メリット
- 制約生成と制約適用を完全に分離できる
- 制約を生成後、適用前に検証やログ出力が可能

#### デメリット
- API が複雑になる（generate → apply の 2 段階）
- 現在の宣言的な API が失われる可能性
- 既存の使用箇所すべてに影響（大規模な変更）
- テストがすべて通っており、現状で問題がない

#### コスト vs ベネフィット
現状で以下が達成されているため、さらなる分離の実益は限定的：
- solver の所有権が明確
- テスタビリティは確保済み（KiwiSolver をモック可能）
- 循環依存はない
- 既存コードとの互換性が保たれている

## 結論

### 移行手順 5 の状態：実質的に完了

以下の理由により、移行手順 5 は「実質的に完了」と判断：

1. **主要な目的は達成済み**
   - solver の所有権が LayoutContext に集約
   - 依存関係が明確化
   - kiwi への依存が一箇所に集約

2. **現在のアーキテクチャは健全**
   - 責務が適切に分離されている
   - テストがすべて通っている
   - 既存コードとの互換性が保たれている

3. **さらなる分離は過剰**
   - コストが高く、ベネフィットが限定的
   - 現状で十分にテスタブル
   - API の使いやすさが損なわれる可能性

### 実施した確認

```bash
$ bun test
 66 pass
 0 fail

$ bun run test:types
# 型テストも成功
```

すべてのテストが成功し、アーキテクチャは健全な状態。

## 現在のアーキテクチャの特徴

### 明確な責務分担

```
┌─────────────────────────────────────────┐
│ LayoutContext                           │
│ - solver を所有                          │
│ - solve() で solver.updateVariables()   │
│ - vars, constraints を保持              │
└───────────┬─────────────────────────────┘
            │
            ├─→ KiwiSolver (所有)
            │   - kiwi.Solver のラッパー
            │   - 制約管理と solve 実行
            │
            ├─→ LayoutVariables (solver 注入)
            │   - 変数の作成と管理
            │   - solver への制約追加を委譲
            │
            └─→ LayoutConstraints (vars 使用)
                - 制約生成ロジック
                - メタデータ管理
                - vars 経由で制約を追加
```

### データフロー

1. LayoutContext が KiwiSolver を作成
2. KiwiSolver を LayoutVariables に注入
3. LayoutVariables を LayoutConstraints に渡す
4. LayoutConstraints が vars 経由で制約を追加
5. 制約は solver に到達（vars → solver）
6. LayoutContext が solver.updateVariables() を呼び出し

このフローは明確で、各層の責務が適切に分離されている。

## 次のステップ

移行手順の残り：
1. ✅ kiwi ラッパーを作成（完了）
2. ✅ 型の切り出し（完了）
3. ✅ LayoutVariables を依存注入対応にする（完了）
4. ✅ LayoutContext に Solver を移動（完了）
5. ✅ LayoutConstraints の責務整理（実質的に完了）
6. ⏳ 呼び出し元の更新（任意／必要に応じて）
7. ⏳ 副次作業と検証（任意／必要に応じて）

**主要な移行目的は完全に達成。残りのステップは任意の最適化項目。**
