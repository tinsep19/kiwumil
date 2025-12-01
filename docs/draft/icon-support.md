# アイコン対応（ドラフト）

作成日: 2025-12-01
作成者: Copilot CLI

## 1. 要件サマリ

### 機能要件
- プラグインはSVGアイコンをファイルとして提供できること。プラグイン提供ディレクトリ内に 'icons' フォルダ（推奨）を作成し、そこに .svg ファイルを置く形とする。
- DSL側でプラグイン提供のアイコンを参照・利用できること。
- 生成される出力SVGは、使用されたアイコンのみを<symbol>要素としてまとめて書き出すこと。
- 実際にアイコンを描画する箇所では<use>要素を参照してSVGシンボルを再利用すること。
- 未使用のアイコンは出力に含めないこと。

### 非機能要件
- 生成されたSVGは軽量であること（未使用アイコンを除外）。
- プラグイン提供のアイコンはセキュアに扱われ、意図しないスクリプト実行を含まないこと。
- 互換性のためにSVGシンボルのID命名規則を定めること（名前衝突回避）。

### 制約
- プラグインが提供するSVGは適切に最適化されたプレーンSVGであることが前提。
- 外部SVG参照は許可しない。すべてインラインに取り込み、<use>は同一ドキュメント内の<symbol>を参照すること（CORS問題回避）。

### 依存関係
- 既存のプラグインインターフェースを拡張する可能性。
- DSLパーサやコード生成部分の変更。

### 未解決の質問
- ID命名規則（プレフィックス／ハッシュ化）をどうするか？
- 外部SVG参照を許可するか、すべてインラインに取り込むか？

（決定）アイコンはプラグイン内の 'icons' フォルダに .svg ファイルを配置する方式で提供する（ファイルベース）。


## 2. ユースケース
- 開発者がプラグインを作成者 uses プラグイン提供アイコンを登録して to アイコンをDSLで利用可能にする。
- DSLユーザー uses アイコン名を指定して to 出力SVG内で<use>参照により同一シンボルを再利用する。


## 3. データ / ドメインモデル候補
- Entity: Icon
  - attributes: id, name, svgContent, sourcePlugin, optimized(boolean)
- Entity: IconRegistry (生成時に集約される)
  - attributes: symbols: Map<id, svgFragment>
- Relationship: Plugin -> provides -> Icon; Generator -> collects -> IconRegistry


## 4. エンジニアリングノート（実装方針）
- 必要モジュール:
  - icon-loader: プラグインからSVGを取り込み、バリデーション・最適化を行う。
  - icon-registry: 使用されたアイコンを集約してsymbolを生成する。
  - svg-generator: 既存のSVG生成ロジックに<svg><defs>...symbol...</defs>を挿入し、各使用箇所で<use>を出力する。
- 既存コードの変更点:
  - プラグインAPIの拡張（アイコン提供エンドポイント）
  - DSLのASTにアイコン参照ノードを追加
  - 最終出力フェーズで使用アイコンの集約処理を追加
- API仕様（案）:
  - プラグインは plugin/icons/*.svg に .svg ファイルを配置する（推奨フォルダ名: icons）。
  - generator.registerIconUsage(nameOrFilename)  // 使用を通知（例: "icons/icon-name.svg" またはファイル名）
  - generator.emitSymbols() => returns combined <symbol> fragments
- UI/UX:
  - ドキュメントにアイコン命名規則と使い方（例: <svg aria-hidden><use href="#icon-prefix-name"/></svg>）を明記
  - ID命名規則:
    - ID命名規則は `${plugin}-${icon_name}` とする（plugin と icon_name をハイフンで結合）。
    - plugin と icon_name は小文字化し、無効文字（空白、スラッシュ、コロン等）は `-` に置換する。
    - 先頭が数字になる場合は `i-` をプレフィックスする。
    - 参照方法: 同一ドキュメント内の `<symbol id="...">` を `<use href="#id" />` で参照する（外部参照は禁止）。

## DSL 変更案

DSL を以下のように改修する

- icon 名前空間を提供。これまでそれぞれ引数だったがオブジェクト形式のコールバック引数に変更する
- icon 名前空間にplugin名 + icon名() でアイコン情報を提供
- アイコン情報には幅、高さおよび参照のためのid値(href)が含まれており、Symbolはこれをもとに配置に必要な制約を追加する
- またSVG生成、制約追加のためのヘルパー関数が提供される

```typescript

TypeDiagrame("tile")
  .use(MyPlugin)
  .build({ el, rel, hint, icon } => {
    // IconInfo provides { height, width, href } from loaded svg icon.
    // provide some methods for constraints , rendering
    const icon1:IconInfo = icon.myplugin.icon1()
    const iconSymbol = el.myplugin.icon({
      icon_info : icon1
    })
  })
  .render(import.meta)

```

## プラグインからのアイコン提供方法

プラグインにアイコン提供用のエントリポイントが提供されていれば、
それを呼出してプラグインからアイコンを登録する


```

interface DiagramPlugin {
  registerIcons(icons: Icons)? 
  // ...
}

export const MyPlugin = {
  registerIcons(icons: Icons) {
    const plugin = 'myplugin'
    // 下記のコードにより、icon.myplugin.icon1(), icon.myplugin.icon2() が提供されるようになる
    icons.createLoader(plugin, import.meta, loader => {
      loader.register('icon1', 'icons/icon1.svg')
      loader.register('icon2', 'icons/icon2.svg')
    }    
  }
}
  
```






## 5. タスク（ToDo）
- [ ] プラグインAPI設計（アイコン提供インターフェース）
- [ ] DSL仕様の更新（アイコン参照ノード・シンタックス）
- [ ] icon-loader モジュール実装（バリデート・最適化）
- [ ] icon-registry 実装（利用されたアイコンを集約）
- [ ] svg-generator の更新（<symbol>生成と<use>出力）
- [ ] ID命名規則の決定
- [ ] セキュリティレビュー（SVGインジェクション対策）
- [ ] ドキュメント更新（docs/design に最終仕様を移行）
- [ ] テストケースの追加（アイコンの登録・使用・除外）


---
次のアクション提案:
- ブランチ作成: `git switch -c feat/icon-support` を提案。
- 上記タスクのうち設計タスクから着手し、docs/design に最終仕様を作成する。
