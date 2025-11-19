# docs/draft 整理計画

## 📊 現状分析

### 完了済み（削除対象）

1. **2025-11-17-layout-doc-review.md**
   - 状態: ドキュメントと実装の差分メモ
   - 対応: 一部は修正済み、残りは今後の課題
   - 処理: → `docs/design/` の更新として反映後、削除

2. **2025-11-18-readme-review-notes.md**
   - 状態: README 修正済み（チェックマーク付き）
   - 処理: → 削除

3. **2025-11-19-hint_grid_figure_builder.md**
   - 状態: 実装完了（devlog に記録済み）
   - 処理: → 削除

4. **2025-11-19-module-cohesion-review.md**
   - 状態: レビュー実施、devlog に記録済み（提案A採用）
   - 処理: → 削除

### 途中まで進行（マージ・整理対象）

5. **2025-11-18-layout-hint-online.md**
   - 状態: LayoutContext のファサード化は完了（devlog 記録済み）
   - 関連: 2025-11-19-constraint-builder-helper.md（完了）
   - 関連: 2025-11-19-container-symbol-base.md（完了）
   - 処理: → 残りの課題を抽出して今後の計画に、本体は削除

6. **2025-11-19-hint_enclose_review.md**
   - 状態: レビュー資料、Grid/Figure Builder に発展
   - 処理: → 削除（Grid/Figure Builder 実装で解決）

7. **2025-11-19-hint_enclose_spec.md**
   - 状態: 初期仕様案、Grid/Figure Builder に発展
   - 関連: 2025-11-19-hint_grid_figure_builder.md（実装完了）
   - 処理: → 削除（Grid/Figure Builder 実装で置き換え）

8. **2025-11-19-constraint-builder-helper.md**
   - 状態: constraint_helpers.ts 実装済み（LayoutContext に統合）
   - 処理: → 削除

9. **2025-11-19-container-symbol-base.md**
   - 状態: ContainerSymbolBase 実装済み
   - 処理: → 削除

### 今後の課題として残す

10. **2025-11-17-symbol-kiwi-variables.md**
    - 状態: Symbol 内に kiwi.Variable を移す長期的な検討
    - 処理: → 残す（長期的なアーキテクチャ検討）

11. **2025-11-19-theme-layout-separation.md**
    - 状態: Theme と LayoutOptions の分離提案（未着手）
    - 処理: → 残す（今後の改善課題）

## 🎯 整理アクション

### ✅ 削除するファイル (9件)

```bash
rm docs/draft/2025-11-17-layout-doc-review.md
rm docs/draft/2025-11-18-readme-review-notes.md
rm docs/draft/2025-11-18-layout-hint-online.md
rm docs/draft/2025-11-19-constraint-builder-helper.md
rm docs/draft/2025-11-19-container-symbol-base.md
rm docs/draft/2025-11-19-hint_enclose_review.md
rm docs/draft/2025-11-19-hint_enclose_spec.md
rm docs/draft/2025-11-19-hint_grid_figure_builder.md
rm docs/draft/2025-11-19-module-cohesion-review.md
```

### 📝 残すファイル (2件)

- **2025-11-17-symbol-kiwi-variables.md** - 長期的なアーキテクチャ検討
- **2025-11-19-theme-layout-separation.md** - 今後の改善課題

### 📋 docs/design への反映

**layout-system.md に追記すべき内容:**

1. Grid/Figure Builder API の説明
2. LayoutContext のファサード化
3. オンライン制約適用の説明

## 📌 今後の課題リスト

### Phase 2: 機能拡張

- [ ] Grid/Figure Builder に padding サポート追加
- [ ] Guide API のドキュメント整備
- [ ] example の追加

### Phase 3: アーキテクチャ改善

- [ ] Theme と LayoutOptions の分離（指摘事項3）
- [ ] Symbol 内に kiwi.Variable を移す検討（長期）

### ドキュメント更新

- [ ] layout-system.md に Grid/Figure Builder を追記
- [ ] layout-system.md に LayoutContext を追記
- [ ] 実装とドキュメントの差分を解消（layout-doc-review.md の内容）

## 🔗 関連 devlog

実装完了の記録:
- `docs/devlog/2025-11-18-layout-context-rework.md` - LayoutContext のファサード化
- `docs/devlog/2025-11-19-module-cohesion-improvement.md` - モジュール凝縮性改善
- `docs/devlog/2025-11-19-grid-figure-builder-implementation.md` - Grid/Figure Builder 実装
