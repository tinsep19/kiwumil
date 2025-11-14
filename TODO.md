# 残タスク

## 最終更新: 2025-11-14

### 🔴 高優先度

#### 1. GALLERY の構成変更と更新
- [ ] GALLERY.md の構成を見直し
- [ ] 新しい構成に基づいて Example ファイルを整理
- [ ] すべての Example を TypedDiagram に更新
- [ ] SVG を再生成

**備考**: ユーザーが構成変更を希望しているため、変更内容を確認してから実施

### 🟡 中優先度

#### 2. ドキュメントの追加更新
- [x] README.md を TypedDiagram に更新
- [ ] マイグレーションガイドの追加（もし既存ユーザーがいた場合の参考）
- [ ] API リファレンスの作成

#### 3. 型定義ファイルの確認
- [ ] `dist/` の型定義ファイルを確認
- [ ] 外部から使用したときの IntelliSense 動作確認

### 🟢 低優先度

#### 4. CI/CD の設定
- [ ] GitHub Actions の設定（もしあれば）

#### 5. パフォーマンス最適化
- [ ] レイアウトソルバーの最適化
- [ ] 大規模図の処理速度改善

---

## 完了したタスク ✅

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
- ✅ すべてのテストが通過 (52/52)

### ドキュメント
- ✅ 設計仕様書の作成 (namespace-dsl.md, typed-diagram-api.md)
- ✅ README.md の TypedDiagram 対応

### PR とマージ
- ✅ PR #40 作成とマージ
- ✅ factory-proxy ブランチ削除
- ✅ feature/namespace-based-dsl ブランチ削除

---

## メモ

- TypedDiagram は Option A (diagram_builder.ts を編集) で実装
- 内部クラス名は `DiagramBuilder` を維持
- コールバック型名は `IntelliSenseBlock`
- CorePlugin がデフォルトで適用される
- すべての変更が main ブランチにマージ済み
