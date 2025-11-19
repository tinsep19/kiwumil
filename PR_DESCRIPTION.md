# feat: Layout Context リファクタリングと Grid/Figure Builder の実装

## 📋 概要

レイアウトシステムの大規模リファクタリングを実施し、開発者体験の向上とコードの保守性改善を達成しました。

### 主な成果

1. ✨ **Grid/Figure Builder:** 複雑なレイアウトを宣言的に記述できる fluent-style API
2. ✨ **派生変数:** `right`/`bottom`/`centerX`/`centerY` による制約記述の簡潔化
3. ♻️ **LayoutContext:** レイアウトAPIの統一窓口
4. ♻️ **ContainerSymbolBase:** コンテナロジックの共通化
5. ♻️ **モジュール凝縮性改善:** 責務分離による保守性向上

## 🎯 主な変更

### 1. Grid/Figure Builder の実装

複数シンボルの矩形配置を簡潔に記述できるAPIを追加。

**Before:**
```typescript
// 手動で全ての制約を記述
hint.arrangeHorizontal(a, b)
hint.arrangeHorizontal(c, d)
hint.arrangeVertical(a, c)
hint.arrangeVertical(b, d)
hint.enclose(container, [a, b, c, d])
```

**After:**
```typescript
// 宣言的な記述
hint.grid(container).enclose([
  [a, b],
  [c, d]
]).gap(10).layout()

// または Figure Builder（非矩形も可）
hint.figure(container).enclose([
  [title],
  [a, b, c]
]).align('center').layout()
```

**追加ファイル:**
- `src/dsl/hint_factory.ts` - GridBuilder/FigureBuilder クラス
- `src/layout/constraint_helpers.ts` - 制約構築ヘルパー
- `tests/grid_figure_builder.test.ts` - 16件のテスト

### 2. 派生レイアウト変数の実装

`right`/`bottom`/`centerX`/`centerY` を遅延生成・キャッシュすることで、コードを約60行削減しパフォーマンスも向上。

**Before:**
```typescript
// 毎回 expression を作成
this.layout.vars.addConstraint(
  this.layout.vars.expression([
    { variable: bounds.x },
    { variable: bounds.width }
  ]),
  Operator.Eq,
  guide.x
)
```

**After:**
```typescript
// 派生変数を直接参照
this.layout.vars.addConstraint(
  bounds.right,
  Operator.Eq,
  guide.x
)
```

**変更ファイル:**
- `src/model/symbol_base.ts` - LayoutBounds をクラス化
- `src/dsl/hint_factory.ts` - GuideBuilder を簡潔化

### 3. LayoutContext のファサード化

レイアウト関連APIを `LayoutContext` 経由で統一し、開発者体験を向上。

**アーキテクチャ:**
```
LayoutContext (ファサード)
  ├── LayoutVariables (変数管理)
  ├── LayoutConstraints (制約管理)
  └── solver: kiwi.Solver
```

**追加ファイル:**
- `src/layout/layout_context.ts` - 統一API

### 4. ContainerSymbolBase の導入

`DiagramSymbol` と `SystemBoundarySymbol` の共通ロジックを基底クラス化。

**追加ファイル:**
- `src/model/container_symbol_base.ts` - 共通基底クラス

**変更ファイル:**
- `src/model/diagram_symbol.ts` - 継承に変更
- `src/plugin/uml/symbols/system_boundary_symbol.ts` - 継承に変更

### 5. モジュール凝縮性の改善

`src/layout`, `src/core`, `src/model` の責務を明確化し、循環依存を解消。

**変更内容:**
- `layout/`: レイアウト変数・制約のみに集中
- `core/`: theme, bounds の型定義に集中
- `model/`: Symbol の振る舞いに集中

## 📊 変更統計

### コード
- **新規ファイル:** 4件
- **変更ファイル:** 約50件
- **追加行:** 約1500行
- **削減行:** 約200行（リファクタリング）

### ドキュメント
- **design/layout-system.md:** +約770行
  - Grid/Figure Builder セクション
  - LayoutContext セクション
  - Guide API セクション
  - 派生変数セクション
- **devlog:** 6件追加
- **draft:** 9件削除（完了済みのため）
- **example:** guide_layout.ts 追加

## ✅ テスト

```bash
bun test
✓ 66 pass
✓ 0 fail
```

全テストが通過し、既存機能への影響はありません。

## 🔄 破壊的変更

**なし** - 後方互換性を維持しています。

## 📝 関連ドキュメント

### Design
- `docs/design/layout-system.md` - 全面的に更新

### Devlog
- `docs/devlog/2025-11-18-layout-context-rework.md` - LayoutContext実装
- `docs/devlog/2025-11-19-module-cohesion-improvement.md` - モジュール改善
- `docs/devlog/2025-11-19-grid-figure-builder-implementation.md` - Builder実装
- `docs/devlog/2025-11-19-derived-layout-variables.md` - 派生変数実装
- `docs/devlog/2025-11-19-documentation-cleanup.md` - ドキュメント整理
- `docs/devlog/2025-11-19-pr-preparation.md` - PR準備

### Draft（将来の作業）
- `docs/draft/2025-11-19-theme-layout-separation.md` - Theme/LayoutOptions分離案
- `docs/draft/2025-11-17-symbol-kiwi-variables.md` - 長期的な改善項目

### Example
- `example/guide_layout.ts` - Guide API の使用例

## 🚀 今後の予定

### Phase 3（別PR予定）
1. Theme と LayoutOptions の分離
2. Relationship のガイド対応
3. より高度なレイアウトパターンの追加

## 🎉 まとめ

このPRにより、Kiwumilのレイアウトシステムは以下の点で大きく進化しました：

1. **開発者体験の向上:** Grid/Figure Builderによる宣言的な記述
2. **コードの簡潔性:** 派生変数により約60行削減
3. **アーキテクチャの明確化:** LayoutContextによる統一API
4. **保守性の向上:** モジュール凝縮性改善により責務分離
5. **拡張性の向上:** 新機能追加が容易な設計

レビューよろしくお願いします！ 🙏
