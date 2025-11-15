# ドキュメント再構成 - 最終計画

## ✅ 確定事項

### 構成: Option B (フラット構成)
```
docs/design/
├── typed-diagram.md          （旧: typed-diagram-api.md）
├── namespace-dsl.md          （変更なし）
├── plugin-system.md          （新規: namespace-dsl.md から抽出）
├── layout-system.md          （旧: LAYOUT_DESIGN.md）
├── theme-system.md           （旧: THEME_DESIGN.md）
└── git-workflow.md           （旧: docs/git-workflow.md）
```

### ファイル名規則
- ✅ 小文字統一
- ✅ `-system` サフィックス採用
- ✅ `-api` サフィックス削除（design配下なので冗長）

### 削除するファイル
- ❌ `DIAGRAM_INFO_SPEC.md` - typed-diagram.md に統合済み
- ❌ `IMPLEMENTATION_SUMMARY.md` - 実装詳細すぎ & 古い情報

### git-workflow.md の配置
- ✅ `docs/design/` に配置（問題なし）

---

## 📝 plugin-system.md の作成

### 抽出元
`namespace-dsl.md` の以下のセクション:

**含める内容:**
1. **プラグインシステムの概要**
   - プラグインとは何か
   - なぜプラグインが必要か
   
2. **DiagramPlugin インターフェース** (Section 3.2)
   - インターフェース定義
   - `name`, `createSymbolFactory`, `createRelationshipFactory`
   
3. **プラグインの実装例** (Section 3.2)
   - UMLPlugin の実装例
   - CorePlugin の実装例（もしあれば）
   
4. **ID 生成規則** (Section 6.4)
   - `namespace:symbolName-serial` 形式
   - カウンター管理
   
5. **新しいプラグインの追加方法** (Section 7.1)
   - ステップバイステップガイド
   - 型安全性の確保方法
   
6. **プラグイン作成のベストプラクティス**
   - 型定義の書き方
   - ファイル構成
   - テストの書き方

**除外する内容:**
- 内部実装の詳細（NamespaceBuilder など）
- マイグレーション戦略
- 型システムの詳細実装
- Phase 1-4 の開発ログ

### 対象読者
**プラグイン作成者** - Kiwumil を拡張して独自の図要素を追加したい開発者

### ゴール
プラグイン作成者が以下を理解できること:
1. プラグインの基本構造
2. Symbol と Relationship の作成方法
3. ID の命名規則と管理
4. 型安全なプラグインの作り方
5. プラグインのテスト方法

---

## 🔄 実行手順

### 1. plugin-system.md の作成
```bash
# namespace-dsl.md から関連セクションを抽出
# プラグイン作成者向けに再編成
# 実装例とベストプラクティスを追加
```

### 2. namespace-dsl.md の更新
```bash
# plugin-system.md に移動したセクションを削除
# 残りは「名前空間DSLの設計思想」に焦点
# plugin-system.md へのリンクを追加
```

### 3. ファイル移動と名前変更
```bash
git mv LAYOUT_DESIGN.md docs/design/layout-system.md
git mv THEME_DESIGN.md docs/design/theme-system.md
git mv docs/design/typed-diagram-api.md docs/design/typed-diagram.md
git mv docs/git-workflow.md docs/design/git-workflow.md
```

### 4. 古いファイルの削除
```bash
git rm DIAGRAM_INFO_SPEC.md
git rm IMPLEMENTATION_SUMMARY.md
```

### 5. README.md の更新
```bash
# ドキュメントへのリンクを追加
# 新しい構成を反映
```

### 6. TODO.md の更新
```bash
# 完了タスクに追加
```

---

## 📊 Before / After

### Before
```
(root)
├── DIAGRAM_INFO_SPEC.md
├── IMPLEMENTATION_SUMMARY.md
├── LAYOUT_DESIGN.md
├── THEME_DESIGN.md
├── README.md
├── TODO.md
└── docs/
    ├── design/
    │   ├── namespace-dsl.md
    │   └── typed-diagram-api.md
    └── git-workflow.md
```

### After
```
(root)
├── README.md
├── TODO.md
└── docs/
    └── design/
        ├── typed-diagram.md
        ├── namespace-dsl.md
        ├── plugin-system.md      ⭐️ NEW
        ├── layout-system.md
        ├── theme-system.md
        └── git-workflow.md
```

---

## 🎯 期待される効果

1. **発見性向上**: すべての設計ドキュメントが docs/design/ に集約
2. **一貫性**: ファイル名規則の統一
3. **保守性**: 古い/重複したドキュメントの削除
4. **拡張性**: plugin-system.md により第三者のプラグイン開発を促進
5. **整理**: 目的別にドキュメントが分類

---

## ✅ 次のアクション

この計画でよろしければ、以下の順で実装します:

1. ✅ plugin-system.md の作成（レビュー依頼）
2. ⏳ ファイル移動と名前変更
3. ⏳ namespace-dsl.md の更新
4. ⏳ README.md の更新
5. ⏳ PR 作成とマージ
