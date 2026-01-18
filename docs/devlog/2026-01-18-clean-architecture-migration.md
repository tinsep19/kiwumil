# Clean Architecture 移行作業ログ

**作業日**: 2026-01-18  
**担当**: GitHub Copilot Agent  
**関連ドキュメント**: `docs/draft/migrate_clean_architecture.md`

## 概要

既存のコードベースを Clean Architecture / DDD スタイルの構造へ段階的に移行しました。
ストラングラーパターンを採用し、既存のすべてのテスト（232 tests）を壊すことなく、
新しいレイヤー構造を確立しました。

## 実装した変更

### 1. ディレクトリ構造の確立

新たに以下のディレクトリ構造を作成しました：

```
src/
├── domain/
│   ├── entity/
│   │   └── icon/
│   │       └── icon_ref.ts          # アイコン参照（実体は持たない）
│   ├── service/                      # (将来使用)
│   └── ports/                        # Infrastructure への抽象化
│       ├── solver.ts                 # Cassowary solver インターフェース
│       ├── symbol.ts                 # ISymbol, ISymbolCharacs
│       ├── relationship.ts           # IRelationship
│       ├── renderer.ts               # Renderer インターフェース
│       ├── icon_provider.ts          # IconProvider 型
│       └── index.ts
│
├── application/
│   ├── layout_context.ts             # 旧 src/model/layout_context.ts
│   ├── symbol_registry.ts            # 旧 src/model/symbols.ts
│   ├── relationship_registry.ts      # 旧 src/model/relationships.ts
│   └── usecase/                      # (将来使用)
│
├── infrastructure/
│   ├── kiwi/                         # 旧 src/kiwi/
│   │   ├── kiwi_solver.ts
│   │   ├── constraints_builder.ts
│   │   ├── suggest_handle.ts
│   │   └── index.ts
│   ├── render/                       # 旧 src/render/
│   │   ├── svg_renderer.ts
│   │   └── index.ts
│   └── icon/                         # 旧 src/icon/
│       ├── icon_loader.ts
│       ├── icon_registry.ts
│       ├── loader_factory.ts
│       ├── svg_generator.ts
│       └── index.ts
│
└── presentation/
    ├── dsl/
    │   └── diagram_builder.ts        # 旧 src/dsl/diagram_builder.ts
    ├── namespace-dsl/
    │   ├── namespace_builder.ts      # 旧 src/dsl/namespace_builder.ts
    │   └── namespace_types.ts        # 旧 src/dsl/namespace_types.ts
    └── index.ts
```

### 2. 再エクスポート戦略

旧パスから新パスへの再エクスポートを実装し、既存コードとの互換性を維持：

- `src/kiwi/index.ts` → `src/infrastructure/kiwi/`
- `src/render/index.ts` → `src/infrastructure/render/`
- `src/icon/index.ts` → `src/infrastructure/icon/`
- `src/model/layout_context.ts` → `src/application/layout_context.ts`
- `src/model/symbols.ts` → `src/application/symbol_registry.ts`
- `src/model/relationships.ts` → `src/application/relationship_registry.ts`
- `src/dsl/diagram_builder.ts` → `src/presentation/dsl/diagram_builder.ts`
- `src/dsl/namespace_builder.ts` → `src/presentation/namespace-dsl/namespace_builder.ts`
- `src/dsl/namespace_types.ts` → `src/presentation/namespace-dsl/namespace_types.ts`

### 3. Domain Ports の実装

Infrastructure への依存を排除するため、以下のインターフェースを定義：

#### `domain/ports/solver.ts`
- `CassowarySolver`: Cassowary アルゴリズムの抽象化
- `LinearConstraint`: 線形制約のインターフェース
- `ConstraintSpec`: 制約構築のコールバック型
- `LinearConstraintBuilder`: Fluent API インターフェース

#### `domain/ports/symbol.ts`
- `ISymbol`: シンボルのインターフェース
- `ISymbolCharacs<T>`: シンボルの特性（拡張可能）

#### `domain/ports/relationship.ts`
- `IRelationship`: 関連のインターフェース
- `IRelationshipCharacs<T>`: 関連の特性

#### `domain/ports/renderer.ts`
- `Renderer`: SVG 描画インターフェース
- `RenderTarget`: 出力先の抽象化

#### `domain/ports/icon_provider.ts`
- `IconProvider`: アイコン参照を返すプロバイダー型

### 4. Composition Root の配置

`diagram_builder.ts` を Presentation 層に配置し、アプリケーション全体の
組み立て（Composition Root）として機能させます。

現時点では Infrastructure（KiwiSolver）を直接インスタンス化していますが、
将来的に Usecase 経由の依存性注入に移行すべきことを TODO コメントで明記しました。

## 依存関係の方向

```
┌─────────────────┐
│  Presentation   │ (DSL, UI)
└────────┬────────┘
         │ depends on
         ▼
┌─────────────────┐
│  Application    │ (Usecases, Registries, Context)
└────────┬────────┘
         │ depends on
         ▼
┌─────────────────┐
│     Domain      │ (Entities, Ports)
└─────────────────┘
         ▲
         │ implements
         │
┌────────┴────────┐
│ Infrastructure  │ (Kiwi, SVG, Icon Loader)
└─────────────────┘
```

Infrastructure が Domain の Ports を実装することで、**依存性逆転の原則**を実現しています。

## テスト結果

### Before Migration
- 232 tests passed
- 0 tests failed
- TypeScript compilation: Success

### After Migration
- 232 tests passed ✅
- 0 tests failed ✅
- TypeScript compilation: Success ✅
- **既存機能に影響なし**

## セキュリティ

CodeQL スキャン実施済み：
- JavaScript: 0 alerts ✅
- セキュリティ上の問題なし

## コードレビューのフィードバック対応

### 1. Domain Ports の型定義修正
**問題**: `CassowarySolver.createConstraint()` の戻り値型が実装と一致していない

**対応**: 戻り値型を `unknown` に変更し、実装の柔軟性を維持

### 2. Presentation 層の依存方向違反
**問題**: DiagramBuilder が Infrastructure (KiwiSolver) を直接参照

**対応**: TODO コメントを追加し、将来的に Usecase 経由の DI に移行すべきことを明記

## 今後の推奨作業

以下のタスクは段階的に実施可能です（既存機能への影響なし）：

### Phase 1: Usecase Layer の実装
1. `application/usecase/create_diagram_context.ts`
2. `application/usecase/load_plugins.ts`
3. `application/usecase/build_diagram.ts`
4. `application/usecase/render.ts`

### Phase 2: Domain Entity の移動
1. `core/layout_variable.ts` → `domain/entity/layout_variable.ts`
2. `core/bounds.ts` → `domain/entity/bounds.ts`
3. `model/layout_variables.ts` の整理

### Phase 3: Domain Service の実装
1. `domain/service/variable_factory.ts`
2. `domain/service/constraint_registrar.ts`

### Phase 4: Composition Root のリファクタリング
1. DiagramBuilder を Usecase 経由に変更
2. Infrastructure の直接インスタンス化を DI に置き換え

### Phase 5: 再エクスポートの削除
1. 内部実装が完全に新パスに移行したことを確認
2. 旧パスの再エクスポートファイルを削除

## 設計判断の根拠

### ストラングラーパターンの採用理由
- テストを壊さずに段階的移行が可能
- ロールバックが容易
- チーム内での変更影響を最小化

### Ports の抽象度
- Domain が特定の技術（Kiwi）に依存しない
- 将来的な solver や renderer の切り替えが容易
- テスタビリティの向上

### Composition Root の配置
- Clean Architecture の推奨に従い、Presentation 層に配置
- アプリケーション全体の依存関係を一箇所で管理
- 現時点では直接インスタンス化だが、将来的に DI に移行予定

## 注意事項

1. **破壊的変更はなし**
   - すべての変更は内部リファクタリング
   - 公開 API は一切変更なし

2. **パフォーマンス影響なし**
   - 実行時の動作は変更なし
   - 再エクスポートによるオーバーヘッドは無視できるレベル

3. **今後の移行作業**
   - 段階的に実施可能
   - 各フェーズで テストを確認しながら進める

## 関連コミット

1. `docs: 移行ステップ章を追加`
2. `feat: Composition Root を presentation 層へ移動`
3. `feat: Domain Ports インターフェースを追加`
4. `feat: Infrastructure 層へ実装を移動（kiwi, render, icon）`
5. `feat: Application 層へレジストリとコンテキストを移動`
6. `feat: Namespace DSL を presentation 層へ移動`
7. `fix: RelationshipId の import パスを修正`
8. `docs: コードレビューのフィードバックを反映（TODO追加とポート修正）`

## 結論

Clean Architecture の基本構造を確立し、既存機能を100%維持しながら、
将来的な拡張性とメンテナンス性を大幅に向上させました。

今後は段階的に Domain Entity、Service、Usecase を実装し、
より完全な Clean Architecture への移行を進めることができます。
