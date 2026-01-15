# クリーンアーキテクチャ移行 - マスター計画書

## 📋 概要

| 項目 | 内容 |
|---|---|
| **バージョン** | `0.1.x` → `0.2.0` |
| **目的** | クリーンアーキテクチャへの移行 |
| **期間** | 約13週間 + 2日 |
| **Phase 数** | 9 Phase |
| **開始日** | 2026-01-15 |
| **目標完了日** | 2026-04-15（予定） |

---

## 🎯 移行の目的

### なぜクリーンアーキテクチャか？

1. **関心の分離**: Infrastructure、Domain、Application の責務を明確化
2. **テスタビリティ**: 制約ソルバーへの依存を抽象化し、テストを容易に
3. **拡張性**: 新しい制約ソルバーやレイアウトアルゴリズムへの対応
4. **保守性**: コードの見通しを良くし、長期的な保守コストを削減

### 現状の課題

- `LayoutContext` が Facade + Service Locator の役割を兼ねている
- `KiwiSolver` が kiwi の型を直接公開している（`kiwi.Variable`）
- `Variable` と `LayoutConstraint` の型が明確に分離されていない
- DI Container がなく、依存関係の管理が手動

---

## 🧩 主要な設計決定

### 1. Solver の分解

**Infrastructure 層: Pure Cassowary Solver**

```typescript
interface FreeVariable {
  // id を知らない純粋な変数
  name(): string
  value(): number
}

interface ICassowarySolver {
  createVariable(name?: string): FreeVariable
  createConstraint(spec: ConstraintSpec): LinearConstraint[]
  updateVariables(): void
  createHandle(variable: FreeVariable, strength: ConstraintStrength): SuggestHandle
}
```

**重要**: `kiwi.Variable` が `FreeVariable` を満たす（ラッパー不要）

**Domain 層: ID とメタデータを管理**

```typescript
interface IVariableFactory {
  createVariable(id: VariableId, type: VariableType): Variable
}

interface IConstraintFactory {
  createConstraint(spec: ConstraintSpec): LayoutConstraint
}
```

---

### 2. Variable の Discriminated Union

**基本構造:**

```typescript
interface BaseVariable {
  id: VariableId
  freeVariable: FreeVariable  // Infrastructure からの参照
  variableType: VariableType  // "anchor_x" | "anchor_y" | "width" | "height" | "anchor_z" | "generic"
}

// Discriminated Union
type AnchorX = BaseVariable & { variableType: "anchor_x" }
type AnchorY = BaseVariable & { variableType: "anchor_y" }
type AnchorZ = BaseVariable & { variableType: "anchor_z" }
type Width = BaseVariable & { variableType: "width" }
type Height = BaseVariable & { variableType: "height" }
type GenericVariable = BaseVariable & { variableType: "generic" }

type Variable = AnchorX | AnchorY | AnchorZ | Width | Height | GenericVariable
```

**利点:**

- 型安全な処理（`switch (variable.variableType)` で完全性チェック）
- 拡張性（新しい変数タイプの追加が容易）

---

### 3. LayoutConstraint の Discriminated Union

**3つのカテゴリ:**

```typescript
// 1. 幾何的制約（必須強度のみ）
interface GeometricConstraint {
  category: "geometric"
  strength: "required"  // リテラル型
  spec: ConstraintSpec
}

// 2. レイアウトヒント
interface LayoutHint {
  category: "hint"
  strength: "strong" | "medium" | "weak"
  spec: ConstraintSpec
}

// 3. シンボル内部制約
interface SymbolInternalConstraint {
  category: "symbol-internal"
  strength: "strong" | "medium" | "weak"
  spec: ConstraintSpec
}

type LayoutConstraint = GeometricConstraint | LayoutHint | SymbolInternalConstraint
```

**重要な分離:**

Bounds の `z` のデフォルト値（`z = 0`）は**幾何的制約ではなくヒント（weak）**として分離:

```typescript
// Before (v0.1.x)
bounds.z = 0  // required 強度の幾何的制約として扱われていた

// After (v0.2.0)
// z = 0 は weak ヒントとして分離
// これにより z-index の柔軟な制御が可能に
```

---

### 4. LayoutContext の Service Locator 化

**Before (v0.1.x):**

```typescript
class LayoutContext {
  // Facade メソッド
  solve(): void
  createConstraint(spec: ConstraintSpec): void
  valueOf(variable: Variable): number
  
  // 内部実装への直接アクセスは不可
}
```

**After (v0.2.0):**

```typescript
class LayoutContext {
  // サービスを直接公開
  readonly variableFactory: IVariableFactory
  readonly constraintFactory: IConstraintFactory
  readonly solverEngine: ICassowarySolver
  readonly suggestHandleService: ISuggestHandleService
  
  // Facade メソッドは削除
}
```

**利点:**

- 各サービスを直接利用可能（柔軟性向上）
- テスト時のモック化が容易
- 責務の明確化

---

### 5. SuggestHandle の簡素化

**Infrastructure 層: シンプルな API**

```typescript
interface ICassowarySolver {
  createHandle(variable: FreeVariable, strength: ConstraintStrength): SuggestHandle
}

interface SuggestHandle {
  suggest(value: number): void
  dispose(): void
}
```

**Domain 層: Fluent Style**

```typescript
interface ISuggestHandleService {
  createHandle(variableId: VariableId, strength: "strong" | "medium" | "weak"): FluentHandle
}

interface FluentHandle {
  suggest(value: number): this
  dispose(): this
}
```

---

## 📅 Phase 構成（9 Phase、13週間 + 2日）

### Phase 0: Lint 設定の更新（2日）

**期間**: 2日  
**見積もり**: 5.5時間

**目標:**

- 新しいレイヤー構造（Clean Architecture）に対応した Lint 設定を整備
- Phase 1 以降の実装がスムーズに進むようにする

**背景:**

- 新しいディレクトリ構造（`src/infra/`, `src/domain/`, `src/application/`）が既存の lint 設定に未対応
- レイヤー間の依存関係を制御する必要がある（Domain → Infrastructure の import を禁止など）

**成果物:**

- `.eslintrc.js` / `eslint.config.js` の更新
- Import linter の設定追加
- `tsconfig.json` の確認・更新
- CI workflow の確認
- `docs/devlog/2026-01-15-phase0-lint-setup.md`

**成功基準:**

- 新しいディレクトリで lint が通る
- レイヤー間の依存関係が制御されている
- CI の lint チェックが通る
- 既存コードの lint エラーが増えていない

---

### Phase 1: Infrastructure 層（2週間）

**期間**: Week 1-2  
**見積もり**: 34時間

**目標:**

- Pure Cassowary Solver の実装
- `FreeVariable` インターフェースの定義
- `kiwi.Variable` との型互換性の確認

**成果物:**

- `src/infra/solver/cassowary/types.ts`
- `src/infra/solver/cassowary/cassowary-solver.interface.ts`
- `src/infra/solver/kiwi/kiwi-solver.ts`
- `src/infra/solver/kiwi/suggest_handle.ts`
- テスト: `tests/infra/kiwi-solver.test.ts`

**成功基準:**

- テストカバレッジ 90% 以上
- 型互換性チェック成功
- すべてのテスト通過

---

### Phase 2: Domain 層（3週間）

**期間**: Week 3-5  
**見積もり**: 50時間

**目標:**

- `Variable` の Discriminated Union 実装
- `LayoutConstraint` の Discriminated Union 実装
- `Bounds` の `z = 0` をヒントに分離

**成果物:**

- `src/domain/variable/types.ts`
- `src/domain/constraint/types.ts`
- `src/domain/bounds/bounds.ts`
- テスト: `tests/domain/*.test.ts`

**成功基準:**

- 型安全性の確保（exhaustiveness check）
- z-index の柔軟な制御が可能
- テストカバレッジ 90% 以上

---

### Phase 3: Domain Services（2週間）

**期間**: Week 6-7  
**見積もり**: 34時間

**目標:**

- `IVariableFactory` の実装
- `IConstraintFactory` の実装
- `ISuggestHandleService` の実装

**成果物:**

- `src/domain/variable/variable-factory.ts`
- `src/domain/constraint/constraint-factory.ts`
- `src/domain/suggest/suggest-handle-service.ts`
- テスト: `tests/domain/services/*.test.ts`

**成功基準:**

- Factory パターンの正しい実装
- サービス間の依存関係が明確
- テストカバレッジ 85% 以上

---

### Phase 4: DI Container（1週間）

**期間**: Week 8  
**見積もり**: 17時間

**目標:**

- 軽量 DI Container の実装
- サービスの登録と解決
- ライフサイクル管理

**成果物:**

- `src/infra/di/container.ts`
- `src/infra/di/service-provider.ts`
- テスト: `tests/infra/di/*.test.ts`

**成功基準:**

- サービスの自動解決
- シングルトン/トランジェントのサポート
- テストカバレッジ 80% 以上

---

### Phase 5: LayoutContext リファクタリング（2週間）

**期間**: Week 9-10  
**見積もり**: 34時間

**目標:**

- Facade メソッドの削除
- サービスの直接公開
- 既存コードの移行

**成果物:**

- `src/model/layout_context.ts` のリファクタリング
- 移行ガイド: `docs/migration-guide.md`
- テスト: 既存テストの更新

**成功基準:**

- すべての既存テストが通過
- API の一貫性
- Breaking Change のドキュメント化

---

### Phase 6: Application Layer（2週間）

**期間**: Week 11-12  
**見積もり**: 34時間

**目標:**

- Use Case の抽出
- Application Service の実装
- DSL との統合

**成果物:**

- `src/application/use-cases/*.ts`
- `src/application/services/*.ts`
- テスト: `tests/application/*.test.ts`

**成功基準:**

- Use Case の責務が明確
- DSL から Application Layer への呼び出しが整理
- テストカバレッジ 75% 以上

---

### Phase 7: Presentation Layer（1週間）

**期間**: Week 13  
**見積もり**: 17時間

**目標:**

- DSL の整理
- API の統一
- 型定義のエクスポート

**成果物:**

- `src/dsl/*.ts` の整理
- `src/index.ts` のエクスポート整理
- 型テスト: `tsd/*.test-d.ts` の更新

**成功基準:**

- 型推論が正しく機能
- API の使いやすさ
- Breaking Change の最小化

---

### Phase 8: テスト・ドキュメント（継続）

**期間**: Phase 1-7 と並行  
**見積もり**: 継続的

**目標:**

- テストカバレッジの維持・向上
- ドキュメントの整備
- サンプルコードの更新

**成果物:**

- `docs/design/*.md` の更新
- `docs/migration-guide.md`
- `examples/*.ts` の更新

**成功基準:**

- 全体のテストカバレッジ 85% 以上
- すべての ADR が記録済み
- 移行ガイドが完全

---

## 📊 マイルストーン

### M1: Infrastructure 完了（Week 2 終了時）

- [ ] Pure Cassowary Solver 実装完了
- [ ] 型互換性チェック成功
- [ ] Infrastructure 層テスト通過

### M2: Domain 完了（Week 5 終了時）

- [ ] Discriminated Union 実装完了
- [ ] Domain Services 実装完了
- [ ] Domain 層テスト通過

### M3: DI Container 完了（Week 8 終了時）

- [ ] DI Container 実装完了
- [ ] サービス登録・解決のテスト通過

### M4: LayoutContext 移行完了（Week 10 終了時）

- [ ] LayoutContext リファクタリング完了
- [ ] すべての既存テスト通過
- [ ] 移行ガイド作成完了

### M5: Application 完了（Week 12 終了時）

- [ ] Use Case 実装完了
- [ ] Application Layer テスト通過

### M6: v0.2.0 リリース（Week 13 終了時）

- [ ] すべての Phase 完了
- [ ] テストカバレッジ目標達成
- [ ] ドキュメント完全
- [ ] リリースノート作成

---

## 🎯 全体の成功基準

### 技術的基準

- [ ] テストカバレッジ 85% 以上（全体）
  - Infrastructure 層: 90% 以上
  - Domain 層: 90% 以上
  - Application 層: 75% 以上
  - Presentation 層: 70% 以上

- [ ] 型安全性
  - すべての Discriminated Union で exhaustiveness check
  - 型テスト（tsd）がすべて通過

- [ ] パフォーマンス
  - 既存ベンチマークとの比較で劣化なし
  - メモリリークなし

### プロセス基準

- [ ] すべての ADR が記録済み
- [ ] 各 Phase のレビュー記録が作成済み
- [ ] 移行ガイドが完全
- [ ] Breaking Change がすべてドキュメント化済み

---

## ⚠️ リスク管理

### リスク 1: `kiwi.Variable` が `FreeVariable` を満たさない

**影響**: High  
**確率**: Medium

**対策:**

- Phase 1 の初期に型互換性チェックを実施
- 満たさない場合は軽量ラッパーを実装

### リスク 2: 既存コードとの互換性問題

**影響**: High  
**確率**: Medium

**対策:**

- Phase 5 で段階的移行
- 移行ガイドの充実
- 十分なテストカバレッジ

### リスク 3: Phase の遅延

**影響**: Medium  
**確率**: Medium

**対策:**

- 週次での進捗確認
- 早期の課題発見と対応
- 必要に応じて Phase の分割

### リスク 4: DI Container の複雑化

**影響**: Low  
**確率**: Low

**対策:**

- 軽量な実装を優先
- 必要最小限の機能に絞る
- 既存ライブラリの検討（必要に応じて）

---

## 📝 ドキュメント計画

### 作成するドキュメント

1. **ADR（Architecture Decision Records）**
   - ADR-001: Solver Interface Design
   - ADR-002: Variable Discriminated Union
   - ADR-003: LayoutConstraint Categories
   - ADR-004: LayoutContext Service Locator
   - ADR-005: DI Container Design

2. **設計ドキュメント**
   - `docs/design/clean-architecture.md`
   - `docs/design/domain-model.md`
   - `docs/design/infrastructure-layer.md`

3. **移行ガイド**
   - `docs/migration-guide.md`
   - Breaking Changes リスト
   - API 変更マッピング

---

## 🔗 関連ドキュメント

- **[README.md](./README.md)**: 計画管理のワークフロー
- **[STATUS.md](./STATUS.md)**: 現在の進捗状況
- **[Phase 0 計画](./phases/phase0-lint-setup.md)**: Lint 設定更新の詳細
- **[Phase 1 計画](./phases/phase1-infrastructure.md)**: Infrastructure 層の詳細

---

**作成日**: 2026-01-15  
**最終更新**: 2026-01-15  
**バージョン**: 1.0
