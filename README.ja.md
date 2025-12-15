[English](README.md) | 日本語

# 🥝 Kiwumil（キューミル）

Kiwumil は、図を「意味」から記述し、必要なときだけ美しく整えるための
TypeScript DSL です。

関係性にもとづく自動レイアウトを基本としつつ、レイアウトヒントによって
整列・間隔・揃えなどの微調整を追加できます。レイアウトヒントは Kiwi（Cassowary）ベースの線形制約ソルバによって解釈され、
数値座標を直接扱うことなく、関係性として配置を記述できます。

名前空間ベースの DSL とプラグイン機構により、
UML 風の図をセマンティクスを保ったままテキストで管理できることを目指しています.

[English](README.md) | 日本語


## 🌱 Why kiwumil?

**kiwumil は、セマンティクスを失わずに図の見た目を整えるための DSL です。**

kiwumil の DSL で図を記述すると、要素や関係といった「意味（セマンティクス）」と、配置や整列といった「レイアウト上の意図」を、混在させつつ明確に分離して表現できます。これにより、図をテキストとして安全に管理し、あとから安全に整え直すことが可能になります。

### なぜ SVG や PlantUML / Mermaid ではないのか

kiwumil は生の SVG を編集するワークフローを主要にしません。SVG は最終成果物として優秀ですが、意味や配置意図を人が読み取りやすい形で保持するのは困難です。また、PlantUML や Mermaid のようにレイアウト指示が意味記述に入り込む方式も採りません。kiwumil では「何がどう関係しているか（セマンティクス）」と「どう整えたいか（レイアウト意図）」を別レイヤーとして扱います。

### なぜ TypeScript の DSL なのか

TypeScript の型システムやエディタ統合（IntelliSense / LSP）を活用することで、セマンティクスを明示的かつ発見しやすく保てます。DSL は単なる記法ではなく、型によって保護された記述面（authoring surface）として機能します。

### 単なる図で終わらせない

Bun / TypeScript 上で動くことで、JSON や CSV、外部 API などとの連携が自然に行えます。結果として、

- テキスト管理できる図
- 外部データから自動生成できる図
- 生成後に人が手で整えることができる図

を実現します。

簡潔に言えば: kiwumil は「意味を守りつつ、図を人の美意識に近づけるための基盤」です。

---

## 📚 クイックリンク

- 📖 設計ドキュメント（英日）: [docs/design/index.ja.md](docs/design/index.ja.md)
- 📐 ガイドライン（英日）: [docs/guidelines/index.ja.md](docs/guidelines/index.ja.md)
- 🧩 サンプル: [examples/](examples/)
- 📝 開発ログ: [docs/devlog/](docs/devlog/)
- 📦 パッケージ: [@tinsep19/kiwumil](https://github.com/tinsep19/kiwumil/packages)
- 📄 ライセンス: [MIT](LICENSE)

---

## 🚀 クイックスタート（例）

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

## 📦 インストール（GitHub Packages）

Kiwumil は GitHub Packages に公開されています。パッケージのインストールには `read:packages` スコープを持つ Personal Access Token (PAT) が必要です。以下の手順に従って環境を設定してください.

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

## 🔧 開発（ローカル）

- 依存導入: `bun install`（または `npm install`/`pnpm install`）
- テスト: `bun run test`
- 型テスト: `bun run test:types`

---

## 🌍 ドキュメント方針

- 設計の主要ページは英日両方を用意します。devlog は作業記録のため日本語優先です。
- 翻訳や補強が必要なページがあれば Issue/PR で提案してください。大規模な再編は devlog に記録してください。

---

## 🤝 貢献について

- 現在は 1.0 前で API は不安定です。外部貢献は段階的に受け入れ予定です。
- まずは Issue を立てて相談してください。ドキュメント改訂は Draft PR（docs/*）で提案してください。

---

## 👥 メンテナ

- TANIGUCHI Kousuke (TANIGUCHI Kousuke, tinsep19)

---

## ✅ What kiwumil does / does not do

### ✅ What kiwumil does

kiwumil は、**図を「意味（セマンティクス）」を中心に記述・管理するための DSL** です。

* 要素や関係性といった **セマンティックな情報** を第一級として扱います
* それらの関係から **自動レイアウト** を行います
* 自動レイアウトの結果に対して、必要な場合のみ **Hint API による整え** を重ねられます
* 整列・内包（figure / grid）・間隔など、人が美しさを感じやすい構造を記述できます
* 数値はマージンや線幅など **必要最小限の場所にのみ登場** します
* TypeScript DSL として提供されるため、エディタ補完や LSP による **高いユーザー体験** を得られます
* Bun / TypeScript を採用することで、JSON・CSV など外部データとの連携も可能です

kiwumil は、
**「意味だけで十分な図」から「少しだけ整えたい図」までを、同じ記述モデルの上で扱う**ことを目的としています。

---

### ❌ What kiwumil does not do

kiwumil は、以下のことを目的としていません。

* 完全自動で「常に美しい図」を生成すること
* 絶対座標やピクセル単位での直接的な配置指定
* WYSIWYG エディタや SVG 編集ツールの代替
* 複雑な制約をユーザーに書かせること
* 魔法の最適化アルゴリズムによるレイアウト解決

内部には制約ベースの仕組みがありますが、
それは **プラグイン開発者やフレームワーク内部のためのもの**であり、
ユーザーが直接扱うことは想定していません。

---

## 👤 Who is this for / not for

### 👍 Who this is for

kiwumil は、次のような人に向いています。

* 図を「見た目」ではなく **意味ある構造** として扱いたい人
* 図をテキストとして Git 管理・レビューしたい人
* 自動レイアウトを尊重しつつ、人の意図を後から加えたい人
* 「あと少し揃えたい」「少しだけ整えたい」と感じる人
* DSL や TypeScript に抵抗がない人
* 図と外部データ・コードを連携させたい人

### 👎 Who this is not for

kiwumil は、次のような用途には向いていません。

* マウス操作で直感的に配置したい人
* WYSIWYG エディタを求めている人
* 座標を直接指定してレイアウトしたい人
* 完全自動レイアウトだけを求める人
* 最短時間で見た目だけの図を作りたい人

---

## 🎯 Design stance

kiwumil は、

> **セマンティクスを壊さずに、見た目を整えられること**

を最も重要な設計方針としています。

自動レイアウトを基盤とし、
必要な場合のみ Hint を重ねることで、
**意味とレイアウトを混在させつつ、分離して記述できる**ことを目指しています。


## 💡 設計思想（簡潔版）

kiwumil はセマンティクスを最優先する DSL で、関係性ベースのレイアウトと必要に応じた微調整により図の見た目を向上させます。セマンティクスを壊さず、自動レイアウトを基盤とし、Hint による調整で視覚品質を高めます。

参照: [docs/design/philosophy-concise.ja.md](docs/design/philosophy-concise.ja.md)
