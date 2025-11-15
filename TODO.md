# 残タスク

## 最終更新: 2025-11-16

### 🔴 高優先度

**現在、高優先度タスクはありません。**

### 🟡 中優先度

#### 2. ドキュメントの追加更新
- [x] README.md を TypedDiagram に更新
- [ ] マイグレーションガイドの追加（もし既存ユーザーがいた場合の参考）
- [ ] API リファレンスの作成

### 🟢 低優先度

#### 5. パフォーマンス最適化
- [ ] レイアウトソルバーの最適化
- [ ] 大規模図の処理速度改善

---

## 完了したタスク ✅

### CI/CD の設定
- ✅ GitHub Actions の CI ワークフロー追加（PR #55）
  - PR作成時とmainブランチへのpush時に自動実行
  - テストの実行
  - ビルドの確認
  - TypeScriptの型チェック

### GALLERY と Example の整理
- ✅ GALLERY.md の構成見直しと更新
- ✅ Example ファイルの整理（不要なファイル削除）
- ✅ すべての Example を TypedDiagram に更新
- ✅ SVG の再生成

### レイアウト制約の修正
- ✅ arrangeHorizontal/arrangeVertical の制約競合を修正（PR #52）
- ✅ X軸・Y軸を独立して制御できるように改善
- ✅ テストの更新（新しい仕様に対応）

### 型定義ファイルの確認
- ✅ `dist/` の型定義ファイルを確認
- ✅ 外部から使用したときの IntelliSense 動作確認（helix-editor + typescript-language-server で動作確認済み）

### Phase 1-4: Namespace-based DSL の実装
- ✅ Phase 1a: プラグインシステムの基盤
- ✅ Phase 1b: RelationshipId の追加
- ✅ Phase 2: 新しいプラグインの実装
- ✅ Phase 3 & 4: DiagramBuilder の移行と旧 API 削除

### TypedDiagram API の実装
- ✅ TypedDiagram 関数の実装
- ✅ IntelliSenseBlock 型の導入
- ✅ DiagramBuilder の内部クラス化
- ✅ src/index.ts の更新
- ✅ CorePlugin のデフォルト適用
- ✅ README.md の更新

### テストの移行
- ✅ tests/namespace_dsl.test.ts (TypedDiagram ベース)
- ✅ tests/uml_relationships.test.ts の移行
- ✅ すべてのテストが通過 (54/54)

### ドキュメント
- ✅ 設計仕様書の作成 (namespace-dsl.md, typed-diagram-api.md)
- ✅ README.md の TypedDiagram 対応
- ✅ GALLERY.md の更新

### PR とマージ
- ✅ PR #40 作成とマージ
- ✅ PR #52 作成とマージ（arrangeHorizontal/arrangeVertical制約の修正）
- ✅ PR #53 作成とマージ（GALLERY.mdとexampleファイルの整理）
- ✅ factory-proxy ブランチ削除
- ✅ feature/namespace-based-dsl ブランチ削除

---

## メモ

- TypedDiagram は Option A (diagram_builder.ts を編集) で実装
- 内部クラス名は `DiagramBuilder` を維持
- コールバック型名は `IntelliSenseBlock`
- CorePlugin がデフォルトで適用される
- すべての変更が main ブランチにマージ済み
- arrangeHorizontal は X軸のみ、arrangeVertical は Y軸のみを制御（2025-11-16改善）
