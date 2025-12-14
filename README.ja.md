[English](README.md) | 日本語

# Kiwumil（キューミル）

Kiwumil は、Kiwi（Cassowary）ベースの制約ソルバと名前空間ベースの DSL を組み合わせ、TypeScript で UML 風の図をテキストで作るためのライブラリです。手動でのレイアウト調整と制約による自動整列を両立し、編集性と精度を両立させることを目指します。

---

## クイックリンク

- 設計ドキュメント（英日）: docs/design/index.ja.md
- ガイドライン（英日）: docs/guidelines/index.ja.md
- サンプル: examples/
- 開発ログ: docs/devlog/（主に日本語）
- パッケージ: @tinsep19/kiwumil
- ライセンス: MIT

---

## クイックスタート（例）

```typescript
import { TypeDiagram, UMLPlugin } from "kiwumil"

TypeDiagram("First Milestone")
  .use(UMLPlugin)
  .build(({ el, rel, hint }) => {
    const user = el.uml.actor("User")
    const login = el.uml.usecase("Login")

    rel.uml.associate(user, login)
    hint.arrangeVertical(user, login)
  })
  .render("output.svg")
```

---

## インストール（GitHub Packages）

Kiwumil は GitHub Packages に公開されています。パッケージのインストールには `read:packages` スコープを持つ Personal Access Token (PAT) が必要です。以下の手順に従って環境を設定してください。

1) 読み取り専用 PAT を発行

- GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic)
- トークンに名前を付け、スコープで `read:packages` のみを選択してください
- 発行されたトークンはコピーして安全に保管してください（パスワード同様に扱います）

2) ~/.npmrc を設定

ホームディレクトリに `~/.npmrc` を作成または編集し、以下を追加します（`YOUR_READONLY_PAT` を置き換えてください）：

```
@tinsep19:registry=https://npm.pkg.github.com/
//npm.pkg.github.com/:_authToken=YOUR_READONLY_PAT
```

セキュリティ注意:
- PAT やトークンを含む `.npmrc` をリポジトリにコミットしないでください
- トークンは環境固有のシークレットストアやパスワードマネージャで管理することを推奨します

3) インストール

```bash
bun install @tinsep19/kiwumil
```

または

```bash
npm install @tinsep19/kiwumil
```

---

## 開発（ローカル）

- 依存導入: `bun install`（または `npm install`/`pnpm install`）
- テスト: `bun run test`
- 型テスト: `bun run test:types`

---

## ドキュメント方針

- 設計の主要ページは英日両方を用意します。devlog は作業記録のため日本語優先です。
- 翻訳や補強が必要なページがあれば Issue/PR で提案してください。大規模な再編は devlog に記録してください。

---

## 貢献について

- 現在は 1.0 前で API は不安定です。外部貢献は段階的に受け入れ予定です。
- まずは Issue を立てて相談してください。ドキュメント改訂は Draft PR（docs/*）で提案してください。

---

## メンテナ

- 田口 耕介 (Kousuke Taniguchi, tinsep19)

