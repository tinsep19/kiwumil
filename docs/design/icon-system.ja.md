日本語 | [English](icon-system.md)

# アイコンシステム

## 概要

アイコンシステムは、プラグインが図表内でSVGアイコンを登録・使用するための仕組みを提供します。このシステムは、効率的なアイコン読み込みとキャッシングのために`LoaderFactory`を使用し、読み込まれたアイコンを自動的に`IconRegistry`に登録します。

## アーキテクチャ

### IconRegister（型定義）

**目的**: プラグインが `createIconFactory` で使用するインターフェース

**責務**:
- `createLoaderFactory` メソッドを提供し、プラグインが `LoaderFactory` インスタンスを取得できるようにする

**型定義**:
```typescript
export type IconRegister = {
  createLoaderFactory: (importMeta: ImportMeta) => LoaderFactory
}
```

**使用例**:
```typescript
createIconFactory(register: IconRegister) {
  const loaderFactory = register.createLoaderFactory(import.meta)
  return {
    icon1: loaderFactory.cacheLoader('icons/icon1.svg'),
  }
}
```

**注意**: `IconRegister` は `IconRegistry` とは異なります：
- `IconRegister`: プラグインAPI用のインターフェース型（`createIconFactory` の引数）
- `IconRegistry`: SVGシンボルを管理するランタイムクラス（後述）

### LoaderFactory

**目的**: IconLoaderインスタンスを作成・キャッシュし、読み込まれたアイコンを自動登録

**責務**:
- 特定のアイコンファイル用のIconLoaderインスタンスを作成
- 読み込まれたメタデータをキャッシュして冗長なファイル読み込みを回避
- 読み込み時にアイコンをIconRegistryに自動登録

**主要メソッド**:
```typescript
class LoaderFactory {
  constructor(plugin: string, baseUrl: string, iconRegistry: IconRegistry)
  cacheLoader(relPath: string): () => IconMeta
}
```

### IconLoader

**目的**: 単一ファイルの読み込みとメタデータ解析処理を担当

**責務**:
- ディスクからSVGファイル内容を読み込む
- SVGメタデータ（viewBox等）を解析
- 構造化されたメタデータ（`IconMeta`）を返す

**主要メソッド**:
```typescript
class IconLoader {
  constructor(plugin: string, name: string, baseUrl: string, relPath: string)
  load_sync(): IconMeta
}
```

**エラーハンドリング**:
- ファイル未検出時に説明的なエラーをスロー
- ファイルシステムエラーを適切に処理

### IconRegistry

**目的**: SVGシンボルの収集と出力のためのランタイムレジストリ

**責務**:
- アイコンSVG内容の登録
- シンボルIDの正規化
- `<symbol>`要素を含む`<defs>`セクションの出力

このクラスはランタイムレンダリングに関する責務を担当し、実際に使用されたアイコンのみが最終的なSVG出力に含まれることを保証します。

## 使用フロー

1. **プラグイン登録フェーズ**:
   ```typescript
   // プラグインはアイコンファクトリを定義
   createIconFactory(register: IconRegister) {
     const loaderFactory = register.createLoaderFactory(import.meta)
     return {
       icon1: loaderFactory.cacheLoader('icons/icon1.svg'),
       icon2: loaderFactory.cacheLoader('icons/icon2.svg'),
     }
   }
   ```

2. **ビルドフェーズ**:
   ```typescript
   // システムはIconRegistryと共にLoaderFactoryを作成
   const iconsRegistry = new IconRegistry()
   const loaderFactory = new LoaderFactory('myplugin', baseUrl, iconsRegistry)
   
   // cacheLoaderは読み込みとキャッシュを行う関数を返す
   const iconFn = loaderFactory.cacheLoader('icons/icon1.svg')
   const meta = iconFn() // 読み込みとIconRegistryへの自動登録
   ```

3. **レンダリングフェーズ**:
   ```typescript
   // IconRegistryは登録されたすべてのアイコンのシンボルを出力
   const defs = iconsRegistry.emit_symbols()
   ```

## 設計の利点

**自動登録**:
- アイコンは読み込み時に自動的にIconRegistryに登録される
- diagram builderでの手動登録が不要
- 実際に使用されたアイコンのみが登録される

**効率的なキャッシング**:
- LoaderFactoryはIconLoaderインスタンスと読み込まれたメタデータの両方をキャッシュ
- 冗長なファイル読み込みを排除
- 同じアイコンへの高速な繰り返しアクセス

**責務の分離**:
- LoaderFactory: キャッシングと登録の調整
- IconLoader: ファイル操作（アイコンの読み込み方法）
- IconRegistry: ランタイムシンボル管理（アイコンの描画方法）

**エラー防止**:
- 型安全なアイコン参照
- 欠落アイコンに対する明確なエラーメッセージ
- 読み込み失敗の適切な処理（nullを返す）

**テスト容易性**:
- 各クラスを独立してテスト可能
- 統合テストで完全なフローを検証
- ファイルシステム操作を容易にモック化

**保守性**:
- 各クラスに単一責任
- 責務間の明確な境界
- 新機能の追加が容易

## セキュリティに関する考慮事項

プラグインはサニタイズされたSVG内容を登録すべきです。本番環境では以下を実施してください：
- スクリプトと外部参照を削除（SVGOまたは同等のツールを使用）
- 登録前にSVG構造を検証
- ディレクトリトラバーサルを防ぐためファイルパスをサニタイズ

## 型安全性

システムは完全なTypeScriptサポートを提供します：
```typescript
// 型安全なアイコン名前空間
icon.myplugin.icon1() // IconMeta | null を返す

// 型安全なファクトリ定義
createIconFactory(register: IconRegister): IconFactoryMap
```

## API例

**プラグイン実装**:
```typescript
export const MyPlugin = {
  name: 'myplugin',

  createIconFactory(register: IconRegister) {
    const loaderFactory = register.createLoaderFactory(import.meta)
    return {
      icon1: loaderFactory.cacheLoader('icons/icon1.svg'),
      icon2: loaderFactory.cacheLoader('icons/icon2.svg'),
    }
  },

  createSymbolFactory(symbols, theme, icons) {
    return {
      mySymbol(label: string) {
        const iconMeta = icons.icon1() // アイコンを読み込み（キャッシュ済み）
        // ... シンボル作成でiconMetaを使用
      }
    }
  }
}
```

## テスト

アイコンシステムには包括的なテストが含まれています：
- `LoaderFactory`の単体テスト（キャッシング、登録）
- `IconLoader`の単体テスト（ファイル読み込み、メタデータ解析）
- IconRegistry統合のテスト
- エラーケースとエッジ条件のテスト

---

英語版ドキュメント: [icon-system.md](icon-system.md)
