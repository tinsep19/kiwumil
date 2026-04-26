# AGENT.md

このファイルは、このリポジトリで作業する人間/AI エージェント向けの **作業ハーネス（手順・規約）** と **コンテキスト（参照先・判断基準）** の単一の入り口です。

## まずやること（最短ルート）

- セットアップ: `bun install`
- テスト: `bun run test`
- Lint: `bun run lint`
- ビルド: `bun run build`
- 型チェック: `bun x tsc --noEmit`

関連スクリプトは `package.json` の `scripts` を正とします。

## Git / ブランチ運用

- `main` への直接 push はしない（PR 経由）。詳細は `docs/design/git-workflow.ja.md`。
- 作業は **git worktree** を使い、`worktrees/<branch>` に作業ツリーを用意する。

例:

```bash
BR="docs/agent-harness-reorg"
mkdir -p "worktrees/$(dirname "$BR")"
# 初回（ブランチ作成 + worktree 作成）
git worktree add -b "$BR" "worktrees/$BR"

# 既存ブランチを worktree 化する場合
git worktree add "worktrees/$BR" "$BR"
```

> ブランチ名に `/` が含まれる場合、`worktrees/docs/xxx` のようにディレクトリが階層化されます。

## ドキュメント運用（SSOT）

このリポジトリは「作業中のメモ」と「最終仕様」を分離します。

- `docs/draft/` : 実装前の検討（作業の着手前に作る）。**PR 前に削除**する。
- `docs/devlog/` : 作業ログ（意思決定の記録）。**日本語のみ**でよい。
  - 命名: `docs/devlog/YYYY-MM-DD-<topic>.md`
- `docs/design/` : 安定した設計・仕様。必要に応じて英日を併記する。
  - 大きめの設計ページを追加する場合は、可能なら `.md`（英）と `.ja.md`（日）のペアを用意する。
- `docs/guidelines/` : 開発ルール/ベストプラクティス（英日 index あり）。

導線:
- README: 利用者向けの入口
- `docs/design/index.ja.md`: 設計の目次
- `docs/guidelines/index.ja.md`: ガイドラインの目次

## PR 前チェック

- `docs/draft/*.md` を削除（必要なら `docs/design/` に統合）
- 変更点がドキュメント規約に影響するなら devlog を追加
- `bun run test && bun run lint && bun run build` が通ること
- PR 本文は日本語で書く

## エージェント向けの作法（コンテキストエンジニアリング）

- まず `AGENT.md` / `README*` / `docs/design/index*` を読み、既存の規約に合わせる。
- 変更は「目的に直接関係する範囲」に限定し、関連ドキュメントだけ更新する。
- 迷う設計判断（どの文書を正にするか、命名規約の変更など）が出たら、ユーザーに確認する。
