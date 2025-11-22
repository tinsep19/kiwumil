# Kiwumil テーマシステム設計書

## 概要

Kiwumil のテーマシステムは、UML図の視覚的スタイル（色、線幅、フォントサイズなど）を統一的に管理するための仕組みです。

---

## アーキテクチャ

### 1. 基本構造

```typescript
// 統一されたスタイルセット
export interface StyleSet {
  textColor: string        // テキストの色
  fontSize: number         // フォントサイズ
  fontFamily: string       // フォントファミリー
  strokeWidth: number      // 線の太さ
  strokeColor: string      // 線の色
  fillColor: string        // 塗りつぶし色
  backgroundColor?: string // 背景色（オプション）
  horizontalGap: number    // 水平方向のデフォルトギャップ
  verticalGap: number      // 垂直方向のデフォルトギャップ
}

// テーマ定義
export interface Theme {
  name: string                                    // テーマ名
  defaultStyleSet: StyleSet                         // デフォルトスタイル
  symbols?: Record<SymbolName, Partial<StyleSet>> // シンボル毎の上書き
}
```

### 2. シンボル名の型定義

```typescript
// SymbolName は string 型（プラグインによる拡張が可能）
export type SymbolName = string
```

**設計理由:**
- プラグインで新しいシンボルを追加する際、theme.ts を変更する必要がない
- サードパーティプラグインが独自のシンボル名を自由に定義できる
- UMLPlugin 以外のシンボル（例: カスタムクラス図要素）にも対応

**既知のシンボル例:**
- `"actor"` - アクター（棒人形）
- `"usecase"` - ユースケース（楕円）
- `"systemBoundary"` - システム境界（矩形コンテナ）

**プラグインによる拡張例:**
```typescript
// CustomPlugin が追加するシンボル
symbols.register("customShape", CustomShapeSymbol)

// テーマでカスタムシンボルのスタイルを定義
const myTheme: Theme = {
  symbols: {
    customShape: {  // 型エラーにならない
      fillColor: '#ff0000'
    }
  }
}
```

---

## スタイル取得の仕組み

### ヘルパー関数

```typescript
export function getStyleForSymbol(theme: Theme, symbolName: SymbolName): StyleSet {
  const symbolStyle = theme.symbols?.[symbolName] || {}
  return {
    textColor: symbolStyle.textColor ?? theme.defaultStyleSet.textColor,
    fontSize: symbolStyle.fontSize ?? theme.defaultStyleSet.fontSize,
    strokeWidth: symbolStyle.strokeWidth ?? theme.defaultStyleSet.strokeWidth,
    strokeColor: symbolStyle.strokeColor ?? theme.defaultStyleSet.strokeColor,
    fillColor: symbolStyle.fillColor ?? theme.defaultStyleSet.fillColor,
    backgroundColor: symbolStyle.backgroundColor ?? theme.defaultStyleSet.backgroundColor
  }
}
```

### 動作原理

1. シンボル固有のスタイル（`theme.symbols[symbolName]`）を取得
2. 設定されていないプロパティは `theme.defaultStyleSet` から取得
3. 完全な `StyleSet` を返す

---

## プリセットテーマ

### 1. Default Theme

```typescript
export const DefaultTheme: Theme = {
  name: 'default',
  defaultStyleSet: {
    textColor: 'black',
    fontSize: 12,
    fontFamily: 'Arial',
    strokeWidth: 2,
    strokeColor: 'black',
    fillColor: 'white',
    backgroundColor: 'white',
    horizontalGap: 80,
    verticalGap: 50
  },
  symbols: {
    systemBoundary: {
      fillColor: '#f8f8f8',
      strokeColor: '#999',
      fontSize: 14
    },
    // CorePlugin の基本図形
    circle: {
      fillColor: 'white',
      strokeColor: 'black'
    },
    rectangle: {
      fillColor: 'white',
      strokeColor: 'black'
    },
    text: {
      fontSize: 14,
      fontFamily: 'Arial'
    }
  }
}
```

**特徴**: モノクロのシンプルなスタイル

---

### 2. Blue Theme

```typescript
export const BlueTheme: Theme = {
  name: 'blue',
  defaultStyleSet: {
    textColor: '#003366',
    fontSize: 12,
    fontFamily: 'Arial',
    strokeWidth: 2,
    strokeColor: '#0066cc',
    fillColor: '#e6f3ff',
    backgroundColor: '#f0f8ff',
    horizontalGap: 80,
    verticalGap: 50
  },
  symbols: {
    actor: {
      strokeColor: '#003366',
      textColor: '#003366'
    },
    usecase: {
      fillColor: '#e6f3ff',
      strokeColor: '#0066cc'
    },
    systemBoundary: {
      fillColor: '#e6f3ff',
      strokeColor: '#0066cc'
    }
  }
}
```

**特徴**: ブルー系の爽やかな配色

---

### 3. Dark Theme

```typescript
export const DarkTheme: Theme = {
  name: 'dark',
  defaultStyleSet: {
    textColor: '#d4d4d4',
    fontSize: 12,
    fontFamily: 'Arial',
    strokeWidth: 2,
    strokeColor: '#569cd6',
    fillColor: '#2d2d2d',
    backgroundColor: '#1e1e1e',
    horizontalGap: 80,
    verticalGap: 50
  },
  symbols: {
    actor: {
      strokeColor: '#4ec9b0',
      textColor: '#d4d4d4'
    },
    usecase: {
      fillColor: '#2d2d2d',
      strokeColor: '#569cd6'
    },
    systemBoundary: {
      fillColor: '#2d2d2d',
      strokeColor: '#808080'
    }
  }
}
```

**特徴**: ダークモード対応、目に優しい配色

---

## 使用方法

### 基本的な使い方

```typescript
import { Diagram, UMLPlugin, BlueTheme, DarkTheme, DefaultTheme } from "kiwumil"

// テーマを指定
Diagram
  .use(UMLPlugin)
  .theme(BlueTheme)  // または DarkTheme, DefaultTheme
  .build("My Diagram", (el, rel, hint) => {
    // 図の定義...
  })
  .render("output.svg")
```

**利用可能なテーマ:**
- `DefaultTheme` - デフォルトのモノクロスタイル
- `BlueTheme` - ブルー系の爽やかな配色
- `DarkTheme` - ダークモード対応

### カスタムテーマの作成

```typescript
import type { Theme } from "kiwumil"

const myTheme: Theme = {
  name: 'custom',
  defaultStyleSet: {
    textColor: '#333333',
    fontSize: 14,
    strokeWidth: 2.5,
    strokeColor: '#ff6600',
    fillColor: '#fff5e6',
    backgroundColor: '#ffffff'
  },
  symbols: {
    actor: {
      strokeColor: '#ff3300',
      strokeWidth: 3
    }
  }
}

Diagram.use(UMLPlugin).theme(myTheme).build(...)
```

---

## シンボルでの実装例

### ActorSymbol

```typescript
export class ActorSymbol extends SymbolBase {
  toSVG(): string {
    // テーマからスタイルを取得
    const style = this.theme 
      ? getStyleForSymbol(this.theme, 'actor') 
      : defaultStyle
    
    return `
      <circle 
        stroke="${style.strokeColor}" 
        stroke-width="${style.strokeWidth}"
      />
      <text 
        fill="${style.textColor}" 
        font-size="${style.fontSize}"
      >
        ${this.label}
      </text>
    `
  }
}
```

---

## 設計の利点

### 1. 一貫性
すべてのスタイルプロパティが `StyleSet` に統一されており、どのシンボルでも同じ方法でスタイルを取得できます。

### 2. 拡張性
新しいシンボルを追加する際、theme.ts の型定義を変更する必要がありません。プラグインシステムと組み合わせることで、完全に独立したシンボル拡張が可能です。

```typescript
// プラグインで新しいシンボルを追加
class ClassDiagramPlugin implements KiwumilPlugin {
  registerSymbols(symbols: SymbolRegistry) {
    symbols.register("class", ClassSymbol)
    symbols.register("interface", InterfaceSymbol)
  }
}

// テーマにクラス図固有のスタイルを追加
const classTheme: Theme = {
  name: 'class-diagram',
  defaultStyleSet: { /* ... */ },
  symbols: {
    class: {
      fillColor: '#ffffcc',
      strokeColor: '#000000'
    },
    interface: {
      fillColor: '#e6f3ff',
      strokeColor: '#0066cc'
    }
  }
}
```

### 3. 柔軟性
- `defaultStyleSet` で全体のスタイルを設定
- `symbols` で特定のシンボルだけ上書き
- 上書きは部分的でもOK（未設定部分は自動的にdefaultStyleSetを使用）

### 4. 保守性
- スタイル取得ロジックが `getStyleForSymbol()` に集約
- テーマ変更時、シンボル側のコード修正が不要

---

## 将来の拡張案

### 1. シンボルインスタンス単位のスタイル上書き

```typescript
const myUsecase = el.usecase("Login")
myUsecase.setStyle({
  fillColor: '#ffcccc'  // このインスタンスだけ色を変更
})
```

### 2. 条件付きスタイル

```typescript
symbols: {
  usecase: (symbolInstance) => {
    return symbolInstance.label.includes("Error")
      ? { fillColor: '#ffcccc' }
      : { fillColor: '#ccffcc' }
  }
}
```

### 3. アニメーション対応

```typescript
symbols: {
  actor: {
    animation: {
      hover: { strokeWidth: 3 },
      active: { fillColor: '#ffff00' }
    }
  }
}
```

---

## まとめ

Kiwumil のテーマシステムは、シンプルでありながら拡張性の高い設計になっています：

✅ **統一インターフェース** - すべてのスタイルが `StyleSet` で管理  
✅ **階層的設定** - デフォルト + シンボル固有の上書き  
✅ **型安全** - TypeScript による型チェック  
✅ **将来対応** - 新しいシンボルや機能の追加が容易  

この設計により、ユーザーは簡単にテーマをカスタマイズでき、開発者は保守しやすいコードを維持できます。
