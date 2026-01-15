# クリーンアーキテクチャ移行計画 - 管理ドキュメント

## 📋 目的

このディレクトリは、kiwumil v0.1.x から v0.2.0 へのクリーンアーキテクチャ移行を計画・追跡・管理するためのものです。

**主な目的:**

- 移行作業の全体像を可視化する
- Phase ごとの進捗を追跡する
- 設計判断を記録し、将来の参照に役立てる
- チーム（または将来の自分）とのコミュニケーションを円滑にする

---

## 📁 ディレクトリ構成

```
docs/migration-plan/
├── README.md                    # このファイル - 計画管理の概要とワークフロー
├── master-plan.md              # マスター計画書（全体像、Phase 構成、設計決定）
├── STATUS.md                   # 進捗ダッシュボード（現在の状況を一目で確認）
├── phases/                     # 各 Phase の詳細計画と日次ログ
│   ├── phase1-infrastructure.md
│   ├── phase1-daily-log.md
│   ├── phase2-domain-layer.md
│   ├── phase2-daily-log.md
│   └── ...
├── adr/                        # Architecture Decision Records
│   ├── 001-solver-interface-design.md
│   ├── 002-variable-discriminated-union.md
│   └── ...
└── reviews/                    # レビュー記録
    ├── phase1-review.md
    └── ...
```

### 各ディレクトリの役割

- **`phases/`**: 各 Phase の詳細タスク分解と日次作業ログ
- **`adr/`**: 重要な設計判断を記録（ADR 形式）
- **`reviews/`**: Phase 完了時のレビュー記録

---

## 🔄 ワークフロー

### 基本的な作業フロー

```
1. 計画作成 → 2. レビュー → 3. 実装 → 4. 完了報告
```

### 詳細フロー

#### 1. 計画作成（Phase 開始前）

- `phases/phaseN-*.md` に詳細タスクを記載
- 見積もり時間、リスク、成功基準を明確化
- ADR が必要な設計判断があれば `adr/` に記録

#### 2. レビュー（実装前）

- 計画内容を確認
- 必要に応じて `docs/draft/*.md` に検討ドキュメントを作成
- 設計の妥当性を検証

#### 3. 実装（Phase 進行中）

- 実装ブランチで作業（`refactor/phaseN-*`）
- 日次ログを `phases/phaseN-daily-log.md` に記録
- 適切なタイミングで `docs/devlog/*.md` に詳細を記録

#### 4. 完了報告（Phase 完了後）

- `reviews/phaseN-review.md` にレビュー記録を作成
- `STATUS.md` を更新
- 必要に応じて `docs/design/*.md` を更新

---

## 🌿 ブランチ戦略

### ブランチ構成

```
main                              # 本番リリース用
  └── develop                     # 開発の主軸
       ├── docs/clean-architecture-migration-plan   # 計画管理（このブランチ）
       ├── refactor/phase1-infrastructure           # Phase 1 実装
       ├── refactor/phase2-domain-layer             # Phase 2 実装
       └── ...
```

### ブランチの役割

#### `docs/clean-architecture-migration-plan`

- **目的**: 計画ドキュメントの管理
- **内容**: `docs/migration-plan/` 配下のすべてのファイル
- **更新タイミング**:
  - Phase 開始前（詳細計画の作成）
  - Phase 進行中（日次ログ、STATUS 更新）
  - Phase 完了後（レビュー記録の作成）

#### `refactor/phaseN-*`

- **目的**: 各 Phase の実装作業
- **内容**: ソースコード、テスト、関連ドキュメント
- **マージ先**: `develop` ブランチ
- **完了条件**:
  - すべてのテストが通過
  - コードレビュー完了
  - `docs/design/*.md` の更新（必要に応じて）

### ブランチ運用の原則

1. **計画ブランチと実装ブランチを分離**
   - 計画の更新と実装を独立して管理
   - Phase の並行検討が可能

2. **実装前に計画を確定**
   - 実装ブランチを切る前に計画ドキュメントをレビュー
   - `docs/draft/*.md` は実装ブランチ作成時に削除

3. **段階的マージ**
   - Phase 完了ごとに `develop` へマージ
   - `develop` で統合テスト
   - マイルストーン達成時に `main` へマージ

---

## 📊 進捗管理

### STATUS.md の役割

- **現在の Phase と進捗率**を一目で確認
- **次のアクション**を明確化
- **メトリクス**（テストカバレッジなど）の追跡

### 日次ログの記録

各 Phase の進行中は `phases/phaseN-daily-log.md` に日々の作業を記録：

- 作業内容
- 完了タスク
- 課題・ブロッカー
- 学んだこと
- 明日の予定
- 作業時間

---

## 🎯 成功基準

### 全体の成功基準

- [ ] 8 Phase すべてが計画通り完了
- [ ] テストカバレッジ 90% 以上（Infrastructure/Domain 層）
- [ ] 既存機能の完全な互換性維持
- [ ] ドキュメントの完全性（設計、ADR、ガイドライン）

### Phase ごとの成功基準

各 Phase の詳細計画に記載

---

## 📝 ADR（Architecture Decision Records）

重要な設計判断は ADR 形式で記録します。

### ADR のテンプレート

```markdown
# ADR-NNN: タイトル

## ステータス
提案中 / 承認済み / 廃止

## コンテキスト
何が問題だったのか？

## 決定
どう解決するか？

## 結果
この決定の影響は？

## 代替案
検討した他の選択肢は？
```

---

## 🔗 関連ドキュメント

- **[master-plan.md](./master-plan.md)**: 移行の全体像と Phase 構成
- **[STATUS.md](./STATUS.md)**: 現在の進捗状況
- **[Phase 1 計画](./phases/phase1-infrastructure.md)**: Infrastructure 層の詳細計画

---

## 📌 注意事項

1. **計画は生き物**: 実装中に判明した問題に応じて柔軟に更新
2. **ドキュメント優先**: 実装前に計画を明確化
3. **記録を残す**: 判断の経緯を ADR や devlog に記録
4. **段階的進行**: 無理に一度に進めず、Phase ごとに確実に

---

**最終更新**: 2026-01-15
