# 残タスク

## 最終更新: 2025-11-14

### 🔴 高優先度

#### 1. GALLERY の構成変更と更新
- [ ] GALLERY.md の構成を見直し
- [ ] 新しい構成に基づいて Example ファイルを整理
- [ ] すべての Example を TypedDiagram に更新
- [ ] SVG を再生成

**備考**: ユーザーが構成変更を希望しているため、変更内容を確認してから実施

#### 2. テストの完全移行
- [ ] `tests/diagram_builder.test.ts` を TypedDiagram に移行
- [ ] `tests/uml_relationships.test.ts` を TypedDiagram に移行
- [ ] すべてのテストを通過させる (現在: 56 pass, 21 fail)

### 🟡 中優先度

#### 3. ドキュメントの追加更新
- [x] README.md を TypedDiagram に更新
- [ ] マイグレーションガイドの追加（もし既存ユーザーがいた場合の参考）
- [ ] API リファレンスの作成

#### 4. 型定義ファイルの確認
- [ ] `dist/` の型定義ファイルを確認
- [ ] 外部から使用したときの IntelliSense 動作確認

### 🟢 低優先度

#### 5. CI/CD の設定
- [ ] すべてのテストを通す
- [ ] GitHub Actions の設定（もしあれば）

#### 6. パフォーマンス最適化
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
- ✅ tests/namespace_dsl.test.ts の更新
- ✅ README.md の更新

### ドキュメント
- ✅ 設計仕様書の作成 (namespace-dsl.md, typed-diagram-api.md)
- ✅ README.md の TypedDiagram 対応

---

## メモ

- TypedDiagram は Option A (diagram_builder.ts を編集) で実装
- 内部クラス名は `DiagramBuilder` を維持
- コールバック型名は `IntelliSenseBlock`
- すべての変更は `feature/namespace-based-dsl` ブランチで実施中
