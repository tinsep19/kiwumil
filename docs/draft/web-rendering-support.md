# Web対応レンダリング機能の設計ドラフト

**作成日**: 2025-11-15  
**ステータス**: Draft（検討中）

## 📋 背景と目的

### 現在の状況

- Kiwumil は現在 Bun/Node.js 環境でのファイル出力専用
- `render()` メソッドは文字列のファイルパスのみを受け取る
- Web ブラウザでの使用は考慮されていない

### 要望

ウェブブラウザでも Kiwumil を使用できるようにしたい。具体的には：

1. **ファイルパス or DOM要素の両対応**
   - ファイルパス文字列 → ファイルに保存（現状維持）
   - HTMLElement → DOM に直接追加（新機能）

2. **`import.meta.url` を使った自動ファイル名生成**
   - `import.meta.url` を渡すと、`.ts` を `.svg` に自動変換して保存
   - 例: `file:///path/to/example/diagram.ts` → `example/diagram.svg`

## 🎯 目標

- **Bun**: ファイルシステムへの保存を継続サポート（Node.js対応は不要）
- **Browser**: DOM要素への直接レンダリングを可能にする
- **DX向上**: `import.meta.url` でファイル名を自動生成し、コードの重複を削減

## 🔍 現在の実装分析

### 関連ファイル

1. **`src/dsl/diagram_builder.ts`** (116-119行目)
   ```typescript
   render: (filepath: string) => {
     const renderer = new SvgRenderer(allSymbols, relationships, this.currentTheme)
     renderer.saveToFile(filepath)
   }
   ```

2. **`src/render/svg_renderer.ts`** (85-89行目)
   ```typescript
   saveToFile(filepath: string) {
     const svg = this.render()
     Bun.write(filepath, svg)
     console.log(`Saved to ${filepath}`)
   }
   ```

3. **使用例** (`example/actor_simple.ts`)
   ```typescript
   Diagram("Simple Actor")
     .use(UMLPlugin)
     .build((element, relation, hint) => {
       element.actor("User")
     })
     .render("example/actor_simple.svg")  // ハードコードされたパス
   ```

### 現在の問題点

1. **環境依存**: `Bun.write()` はブラウザで使用不可
2. **冗長性**: 各exampleファイルで `"example/xxx.svg"` を手動指定
3. **型の硬直性**: `render()` は `string` のみ受け付ける

## 💡 提案する設計

### 1. `render()` メソッドのオーバーロード

```typescript
// src/dsl/diagram_builder.ts の return オブジェクト

return {
  symbols: allSymbols,
  relationships,
  
  // オーバーロード1: 文字列パス（既存の動作）
  // オーバーロード2: import.meta.url からの自動生成
  // オーバーロード3: HTMLElement への直接レンダリング
  render(target: string | ImportMeta | HTMLElement): void
}
```

### 2. レンダリングロジックの分離

```typescript
// src/render/svg_renderer.ts

export class SvgRenderer {
  // ... 既存のコード ...
  
  // SVG文字列を生成（既存）
  render(): string {
    // ... 現在の実装 ...
  }
  
  // ファイルに保存（既存、引き続き使用）
  saveToFile(filepath: string): void {
    const svg = this.render()
    Bun.write(filepath, svg)
    console.log(`Saved to ${filepath}`)
  }
  
  // DOM要素にレンダリング（新規）
  renderToElement(element: HTMLElement): void {
    const svg = this.render()
    element.innerHTML = svg
  }
}
```

### 3. `render()` メソッドの実装案

```typescript
// src/dsl/diagram_builder.ts

render: (target: string | ImportMeta | HTMLElement) => {
  const renderer = new SvgRenderer(allSymbols, relationships, this.currentTheme)
  
  if (typeof target === "string") {
    // ケース1: 文字列パス → ファイル保存
    renderer.saveToFile(target)
  } else if ("url" in target) {
    // ケース2: import.meta → 自動ファイル名生成
    const filepath = convertMetaUrlToSvgPath(target.url)
    renderer.saveToFile(filepath)
  } else {
    // ケース3: HTMLElement → DOM レンダリング
    renderer.renderToElement(target)
  }
}
```

### 4. `import.meta.url` 変換ユーティリティ

```typescript
// src/utils/path_helper.ts (新規)
import { fileURLToPath } from "node:url"

/**
 * import.meta.url を SVG ファイルパスに変換
 * 
 * @example
 * convertMetaUrlToSvgPath("file:///home/user/repos/kiwumil/example/actor_simple.ts")
 * // => "example/actor_simple.svg"
 */
export function convertMetaUrlToSvgPath(metaUrl: string): string {
  // node:url の fileURLToPath を使用してファイルパスに変換
  // これにより Windows/Unix 両対応が可能
  const filepath = fileURLToPath(metaUrl)
  
  // .ts を .svg に置換
  return filepath.replace(/\.ts$/, ".svg")
}
```

## 📝 使用例

### ケース1: 従来通りのファイルパス指定

```typescript
TypedDiagram("My Diagram")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    el.uml.actor("User")
  })
  .render("output/my-diagram.svg")  // 既存の動作を維持
```

### ケース2: `import.meta.url` を使った自動生成

```typescript
// example/actor_simple.ts
TypedDiagram("Simple Actor")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    el.uml.actor("User")
  })
  .render(import.meta)  // 自動的に "example/actor_simple.svg" に保存
```

### ケース3: ブラウザでのDOM要素へのレンダリング

```typescript
// ブラウザ環境
const container = document.getElementById("diagram-container")!

TypedDiagram("Web Diagram")
  .use(UMLPlugin)
  .build((el, rel, hint) => {
    el.uml.actor("User")
  })
  .render(container)  // container の innerHTML に SVG を挿入
```

## 🤔 検討事項

### 1. 型定義の問題

- **`ImportMeta`** 型は TypeScript の標準型
- しかし `import.meta` 全体を渡すのは冗長かもしれない
  - 代替案: `import.meta.url` (string) を渡す？
  - しかし string との区別が難しい

```typescript
// 案A: ImportMeta を渡す（明示的だが冗長）
.render(import.meta)

// 案B: import.meta.url を渡す（シンプルだが区別が難しい）
.render(import.meta.url)  // これは string なので、通常のファイルパスと区別できない
```

→ **推奨**: `ImportMeta` を渡す方式（型で区別可能）

### 2. 環境判定

- `Bun.write()` はブラウザで利用不可
- Bun環境のみでファイル保存をサポート（Node.js対応は不要）

```typescript
// 実行時判定の例
saveToFile(filepath: string): void {
  const svg = this.render()
  
  if (typeof Bun !== "undefined" && Bun.write) {
    // Bun 環境のみサポート
    Bun.write(filepath, svg)
    console.log(`Saved to ${filepath}`)
  } else {
    // Bun以外の環境
    throw new Error("File system operations are only supported in Bun environment")
  }
}
```

### 3. HTMLElement の型判定

```typescript
// HTMLElement かどうかの判定
if (target instanceof HTMLElement) {
  renderer.renderToElement(target)
}
```

→ ただし、これは実行時の DOM が存在する環境でのみ動作する

### 4. パス変換の精度

- `fileURLToPath()` を使用することで、クロスプラットフォーム対応が自動的に実現
- `.ts` を `.svg` に置換するシンプルな実装
- 必要に応じて、将来的にカスタマイズオプションを追加可能

```typescript
// 拡張案（将来的に）
.render(import.meta, { outputDir: "output" })
```

### 5. TypeScript の module 設定

- `import.meta` を使用するには `tsconfig.json` で:
  - `"module": "ES2020"` 以上
  - `"target": "ES2020"` 以上

→ 現在の設定を確認する必要がある

## 🚧 実装の影響範囲

### 変更が必要なファイル

1. **`src/dsl/diagram_builder.ts`**
   - `render()` メソッドの型定義とロジック変更

2. **`src/render/svg_renderer.ts`**
   - `renderToElement()` メソッド追加
   - `saveToFile()` の環境判定追加（オプション）

3. **`src/utils/path_helper.ts`** (新規)
   - `convertMetaUrlToSvgPath()` 関数実装

4. **`src/index.ts`**
   - 必要に応じて型や関数をエクスポート

5. **`example/*.ts`** (任意)
   - 既存のコードは動作を維持
   - 新しい書き方に更新することも可能

### 後方互換性

✅ **完全に後方互換性あり**
- 既存の `render("path/to/file.svg")` は引き続き動作
- 新機能はオプション扱い

## 📊 リスク評価

| リスク | 影響度 | 対策 |
|--------|--------|------|
| 環境判定の複雑化 | 低 | Bun環境のみサポートで単純化 |
| import.meta が使えない環境 | 低 | 従来のパス指定を継続サポート |
| TypeScript設定の互換性 | 低 | tsconfig.json の確認済み |
| fileURLToPath の動作 | 低 | node:url は標準モジュール |

## ✅ 次のステップ

1. **tsconfig.json の確認**
   - `import.meta` がサポートされているか確認

2. **プロトタイプ実装**
   - `render()` メソッドのオーバーロード
   - `convertMetaUrlToSvgPath()` の実装

3. **テストケース作成**
   - 各ケースの動作確認
   - 環境ごとの動作検証

4. **ドキュメント更新**
   - README.md への使用例追加
   - API ドキュメント更新

## 💭 オープンクエスチョン

1. `import.meta` vs `import.meta.url` どちらを採用すべきか？
   → **決定**: `import.meta` を採用（型で区別可能）
2. 環境判定は実行時 vs ビルド時？
   → **決定**: 実行時判定で Bun 環境のみサポート
3. パス変換のカスタマイズオプションは必要か？
   → 初期実装では不要、必要に応じて将来追加
4. ブラウザ版とBun版で別々のエントリポイントを用意すべきか？
   → 単一エントリポイントで実行時判定

---

**このドラフトについて**:
実装前にレビュー・フィードバックをお願いします。
特に、API設計の使いやすさと実装の複雑さのバランスについてご意見をいただけると助かります。
