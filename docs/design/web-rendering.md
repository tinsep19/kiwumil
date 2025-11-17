# Web対応レンダリングシステム

**作成日**: 2025-11-15  
**ステータス**: Implemented

## 概要

Kiwumil のレンダリングシステムを拡張し、ファイル保存だけでなく、ウェブブラウザでの DOM レンダリングもサポートします。

## レンダリング方式

### 1. ファイルパス指定

従来の方法。文字列でファイルパスを指定します。

```typescript
.render("output/diagram.svg")
```

**動作環境**: Bun のみ

### 2. import.meta による自動パス生成

`import.meta` を渡すことで、現在のファイルパスから自動的に出力パスを生成します。

```typescript
// example/my_diagram.ts で実行
.render(import.meta)  // → example/my_diagram.svg
```

**実装**: `node:url` の `fileURLToPath()` を使用してクロスプラットフォーム対応。

**動作環境**: Bun のみ

### 3. DOM要素への直接レンダリング

ブラウザ環境では、DOM要素を渡すことで直接レンダリングできます。

```typescript
const container = document.getElementById("diagram")!
.render(container)
```

**実装**: `element.innerHTML` に SVG 文字列を設定。

**動作環境**: ブラウザ

## 型定義

```typescript
render(target: string | ImportMeta | Element): void
```

### 型判定ロジック

```typescript
if (typeof target === "string") {
  // ケース1: ファイルパス
  renderer.saveToFile(target)
} else if ("url" in target) {
  // ケース2: import.meta
  const filepath = convertMetaUrlToSvgPath(target.url)
  renderer.saveToFile(filepath)
} else {
  // ケース3: DOM要素
  renderer.renderToElement(target)
}
```

## 実装の詳細

### `src/utils/path_helper.ts`

`import.meta.url` を SVG ファイルパスに変換するユーティリティ。

```typescript
import { fileURLToPath } from "node:url"

export function convertMetaUrlToSvgPath(metaUrl: string): string {
  const filepath = fileURLToPath(metaUrl)
  return filepath.replace(/\.ts$/, ".svg")
}
```

### `src/render/svg_renderer.ts`

2つのレンダリングメソッドを提供:

1. **`saveToFile(filepath: string)`**
   - Bun 環境でのみ動作
   - `Bun.write()` でファイルに保存

2. **`renderToElement(element: Element)`**
   - ブラウザ環境で動作
   - `element.innerHTML` に SVG を設定

### `src/dsl/diagram_builder.ts`

`render()` メソッドで型判定を行い、適切なレンダリング方法を選択。

## 環境対応

| 環境 | ファイル保存 | DOM レンダリング |
|------|------------|----------------|
| Bun  | ✅ | ❌ |
| Browser | ❌ | ✅ |
| Node.js | ❌ | ❌ |

**Note**: Node.js 対応は現時点では不要と判断。

## TypeScript 設定

`tsconfig.json` に DOM 型定義を追加:

```json
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM"]
  }
}
```

## 使用例

### Bun環境での使用

```typescript
// 従来の方法
TypeDiagram("Diagram 1")
  .use(UMLPlugin)
  .build((el, rel, hint) => { /* ... */ })
  .render("output/diagram1.svg")

// import.meta による自動生成
TypeDiagram("Diagram 2")
  .use(UMLPlugin)
  .build((el, rel, hint) => { /* ... */ })
  .render(import.meta)
```

### ブラウザ環境での使用

```typescript
import { TypeDiagram, UMLPlugin } from "kiwumil"

const container = document.getElementById("diagram-container")!

TypeDiagram("Interactive Diagram")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    const user = el.uml.actor("User")
    const system = el.uml.usecase("System")
    rel.uml.associate(user, system)
    hint.arrangeHorizontal(user, system)
  })
  .render(container)
```

## 後方互換性

✅ 完全な後方互換性を維持:
- 既存の `render("path.svg")` は変更なく動作
- 既存のテストはすべて通過

## 将来の拡張案

1. **出力オプション**
   ```typescript
   .render(import.meta, { outputDir: "output" })
   ```

2. **相対パス/絶対パスの選択**
   ```typescript
   .render(import.meta, { absolute: false })
   ```

3. **SVGオプション**
   ```typescript
   .render(container, { width: 800, height: 600 })
   ```
