# 2025-11-19 ドキュメント整理

## 作業内容

### docs/draft の整理

11個のdraftファイルを精査し、以下のように整理しました。

#### ✅ 削除対象（9件）- 実装完了

1. **2025-11-17-layout-doc-review.md** - ドキュメント差分メモ（design更新で解消）
2. **2025-11-18-readme-review-notes.md** - README修正完了
3. **2025-11-18-layout-hint-online.md** - LayoutContext実装完了
4. **2025-11-19-constraint-builder-helper.md** - constraint_helpers実装完了
5. **2025-11-19-container-symbol-base.md** - ContainerSymbolBase実装完了
6. **2025-11-19-hint_enclose_review.md** - Grid/Figure Builder実装で解決
7. **2025-11-19-hint_enclose_spec.md** - Grid/Figure Builder実装で置き換え
8. **2025-11-19-hint_grid_figure_builder.md** - Grid/Figure Builder実装完了
9. **2025-11-19-module-cohesion-review.md** - モジュール凝縮性改善完了

#### 📝 残すファイル（2件）- 今後の課題

10. **2025-11-17-symbol-kiwi-variables.md** - Symbol内にkiwi.Variable移行の長期検討
11. **2025-11-19-theme-layout-separation.md** - ThemeとLayoutOptions分離の提案

### docs/design/layout-system.md の更新

実装済みの機能を設計ドキュメントに反映しました：

#### 追加したセクション

1. **Grid/Figure Builder**（約180行）
   - API設計と使用例
   - 矩形検証の仕組み
   - Guide APIとの一貫性
   - 将来の拡張計画

2. **LayoutContext**（約150行）
   - アーキテクチャ概要
   - Variables/Constraintsの役割分担
   - オンライン制約適用の説明
   - Symbol生成時の制約適用
   - 制約の追跡方法

3. **まとめセクション**
   - 完了した機能のリスト
   - 今後の拡張計画

### 整理の成果

#### Before
- draft: 11ファイル（混在状態）
- design/layout-system.md: 1127行（Grid/Figure Builder未記載）

#### After
- draft: 2ファイル（今後の課題のみ）
- design/layout-system.md: 1540行（+413行、最新機能を反映）

### 削除予定ファイルリスト

CLEANUP_PLAN.mdに整理計画を記載し、以下のコマンドで削除可能：

```bash
rm docs/draft/2025-11-17-layout-doc-review.md \
   docs/draft/2025-11-18-readme-review-notes.md \
   docs/draft/2025-11-18-layout-hint-online.md \
   docs/draft/2025-11-19-constraint-builder-helper.md \
   docs/draft/2025-11-19-container-symbol-base.md \
   docs/draft/2025-11-19-hint_enclose_review.md \
   docs/draft/2025-11-19-hint_enclose_spec.md \
   docs/draft/2025-11-19-hint_grid_figure_builder.md \
   docs/draft/2025-11-19-module-cohesion-review.md
```

## 今後の課題

### Phase 2: 機能拡張
- [ ] Grid/Figure Builder の padding サポート
- [ ] Guide API のドキュメント整備
- [ ] example の追加

### Phase 3: アーキテクチャ改善
- [ ] Theme と LayoutOptions の分離
- [ ] Symbol 内に kiwi.Variable を移す検討（長期）

### ドキュメント
- [ ] plugin-system.md の更新（LayoutContext引数の説明）
- [ ] namespace-dsl.md の更新（最新例の追加）

## 関連ファイル

- `docs/draft/CLEANUP_PLAN.md` - 詳細な整理計画
- `docs/design/layout-system.md` - 更新済み（+413行）
- 実装完了のdevlog:
  - `2025-11-18-layout-context-rework.md`
  - `2025-11-19-module-cohesion-improvement.md`
  - `2025-11-19-grid-figure-builder-implementation.md`
