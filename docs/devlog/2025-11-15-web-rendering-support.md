# Web対応レンダリング機能の実装

**作成日**: 2025-11-15  
**ブランチ**: feature/web-rendering-support

## 🎯 実装目的

Kiwumil をウェブブラウザでも使用できるようにするため、`render()` メソッドを拡張しました。

## ✅ 実装内容

### 1. 新規ファイル作成

#### `src/utils/path_helper.ts`
- `convertMetaUrlToSvgPath()` 関数を実装
- `node:url` の `fileURLToPath()` を使用してクロスプラットフォーム対応
- `import.meta.url` から自動的に `.svg` パスを生成

```typescript
export function convertMetaUrlToSvgPath(metaUrl: string): string {
  const filepath = fileURLToPath(metaUrl)
  return filepath.replace(/\.ts$/, ".svg")
}
```

### 2. 既存ファイルの変更

#### `src/render/svg_renderer.ts`
- `saveToFile()` に環境判定を追加（Bun環境のみサポート）
- `renderToElement()` メソッドを追加（DOM要素へのレンダリング）

```typescript
saveToFile(filepath: string) {
  const svg = this.render()
  
  if (typeof Bun !== "undefined" && Bun.write) {
    Bun.write(filepath, svg)
    console.log(`Saved to ${filepath}`)
  } else {
    throw new Error("File system operations are only supported in Bun environment")
  }
}

renderToElement(element: Element) {
  const svg = this.render()
  element.innerHTML = svg
}
```

#### `src/dsl/diagram_builder.ts`
- `render()` メソッドを拡張して3つの入力タイプに対応:
  - `string`: 従来のファイルパス指定
  - `ImportMeta`: `import.meta` による自動パス生成
  - `Element`: DOM要素への直接レンダリング

```typescript
render: (target: string | ImportMeta | Element) => {
  const renderer = new SvgRenderer(allSymbols, relationships, this.currentTheme)
  
  if (typeof target === "string") {
    renderer.saveToFile(target)
  } else if ("url" in target) {
    const filepath = convertMetaUrlToSvgPath(target.url)
    renderer.saveToFile(filepath)
  } else {
    renderer.renderToElement(target)
  }
}
```

#### `tsconfig.json`
- `"lib"` に `"DOM"` を追加して DOM API の型定義を有効化

### 3. テスト用ファイル作成

#### `example/web_rendering_test.ts`
- `import.meta` を使った自動パス生成のテスト例
- 実行すると `example/web_rendering_test.svg` が自動生成される

## 🧪 動作確認

### 既存機能のテスト
```bash
bun test
# ✓ 52 pass, 0 fail
```

### ビルドテスト
```bash
bun run build
# ✓ 正常にビルド完了
```

### 従来のパス指定（後方互換性）
```bash
bun example/actor_simple.ts
# ✓ Saved to example/actor_simple.svg
```

### import.meta を使った自動生成
```bash
bun example/web_rendering_test.ts
# ✓ Saved to /home/kousuke/repos/kiwumil/example/web_rendering_test.svg
```

## 📝 使い方

### ケース1: 従来通りのファイルパス指定
```typescript
TypeDiagram("My Diagram")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    el.uml.actor("User")
  })
  .render("output/my-diagram.svg")
```

### ケース2: import.meta による自動パス生成
```typescript
// example/my_diagram.ts
TypeDiagram("My Diagram")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    el.uml.actor("User")
  })
  .render(import.meta)  // 自動的に example/my_diagram.svg に保存
```

### ケース3: ブラウザでの DOM レンダリング（将来）
```typescript
const container = document.getElementById("diagram")!

TypeDiagram("Web Diagram")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    el.uml.actor("User")
  })
  .render(container)  // container.innerHTML に SVG を挿入
```

## 🎨 設計の特徴

### 完全な後方互換性
- 既存の `render("path.svg")` は引き続き動作
- 既存のテストもすべて通過

### シンプルな実装
- `fileURLToPath()` でクロスプラットフォーム対応を標準APIに任せる
- 複雑なパス解析ロジックを排除
- 実行時の型判定で適切なレンダリング方法を選択

### 環境判定
- Bun環境: `Bun.write()` でファイル保存
- ブラウザ環境: `element.innerHTML` で DOM レンダリング
- その他: エラーを投げる（Node.js は未サポート）

## 🔧 技術的な決定事項

1. **`import.meta` vs `import.meta.url`**
   - `import.meta` を採用
   - 理由: TypeScript の型で区別可能（`string` との混同を避ける）

2. **`HTMLElement` vs `Element`**
   - `Element` を採用
   - 理由: より汎用的、`innerHTML` は `Element` で利用可能

3. **Node.js 対応**
   - Bun 環境のみをサポート
   - 理由: プロジェクトが Bun をターゲットにしているため

4. **DOM ライブラリの追加**
   - `tsconfig.json` に `"DOM"` を追加
   - 理由: ブラウザ環境での使用を想定

## 📦 変更ファイル一覧

- **新規作成**:
  - `src/utils/path_helper.ts`
  - `example/web_rendering_test.ts`
  - `example/web_rendering_test.svg`
  - `docs/draft/web-rendering-support.md`

- **変更**:
  - `src/dsl/diagram_builder.ts`
  - `src/render/svg_renderer.ts`
  - `tsconfig.json`
  - `example/actor_simple.ts` (テスト用の更新)

## 🚀 次のステップ

1. PR 作成前に:
   - ドラフト削除
   - README.md 更新（使用例追加）
   - 必要に応じて設計ドキュメント作成

2. 将来の改善案:
   - ブラウザ環境での実際のテスト
   - 出力ディレクトリのカスタマイズオプション
   - 相対パス/絶対パスの選択オプション
