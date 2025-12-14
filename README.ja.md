[English](README.md) | 日本語

# Kiwumil（キューミル）

Kiwumil は、Kiwi（Cassowary）ベースの制約ソルバと名前空間ベースの DSL を組み合わせ、TypeScript で UML 風の図をテキストで作るためのライブラリです。手動でのレイアウト調整と制約による自動整列を両立し、編集性と精度を両立させることを目指します。

---

## クイックリンク

- 設計ドキュメント（英日）: [docs/design/index.ja.md](docs/design/index.ja.md)
- ガイドライン（英日）: [docs/guidelines/index.ja.md](docs/guidelines/index.ja.md)
- サンプル: [examples/](examples/)
- 開発ログ: [docs/devlog/](docs/devlog/)
- パッケージ: [@tinsep19/kiwumil](https://github.com/tinsep19/kiwumil/packages)
- ライセンス: [MIT](LICENSE)

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

- TANIGUCHI Kousuke (TANIGUCHI Kousuke, tinsep19)




## ヒント API の思想

**Hint API は「数値で描くための API」ではありません。しかし、数値を排除する API でもありません。**
マージンやパディング、線幅、場合によっては縦横比など、数値が意味を持つ場面では数値を使いますが、座標を直接指定する命令的な配置は避けます。

kiwumil が避けるもの:

- 絶対座標の指定
- 「要素を (x, y) に置く」ような命令的な指示
- 見た目の都合だけで意味を歪める指定

### "きれい" の本質

kiwumil は「整列」が視覚的に重要だと考えます。

- 中心が揃う
- 端が揃う
- 間隔が均一である
- 視覚基準線が通る

これらはすべて関係性として表現可能であり、Hint API はそのための手段を提供します。

### 自動レイアウトの立ち位置

完全自動は目指さず、次の2段階で扱います：

1. `figure` / `grid` で大まかな骨格を配置
2. Hint で人の意図（整列や関係）を与えて細部を整える

### 使い方の感覚（上位概念）

1. `figure` / `grid`（enclose 系）で構造を作る
2. `align` / `arrange` でエッジや中心を揃え、間隔を整える

Hint は「ここに置け」ではなく「こう揃えたい」「この関係を保ちたい」という意図を伝える API です。

### まとめ

- 数値は使うが、数値が支配しない
- 自動化は補助であり主役ではない
- 視覚品質は整列で決まる
- 大まかな構造 → 人による細部調整、が基本ワークフローです
