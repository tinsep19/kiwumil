# Kiwumil コアドメイン定義 v0.2.0

## ビジョンステートメント

Kiwumiは、人間のレイアウト思考と制約ベースのレイアウト解決を橋渡しする**ドメイン翻訳エンジン**です。その中核的価値は、制約を解くことや図を描画することではなく、レイアウト意図を表現するための豊かな語彙を提供し、その語彙を正確で組み合わせ可能な制約方程式に忠実に翻訳することにあります。

## Kiwumilが何であり、何でないか

### Kiwumilが「である」もの:
- **レイアウトセマンティクスの語彙**: 配置、間隔、グループ化、階層、フローなどの概念を提供
- **ドメイン翻訳エンジン**: レイアウトセマンティクスをCassowary制約方程式に変換
- **型安全なDSL**: レイアウト意図を表現するための流暢でコンパイル時にチェックされるAPI
- **組み合わせフレームワーク**: レイアウトセマンティクスを予測可能な方法で組み合わせ可能

### Kiwumilが「でない」もの:
- **制約ソルバーではない**: 解決はCassowaryアルゴリズムに委譲
- **レンダリングエンジンではない**: 描画はSVG/Canvas/WebGLに委譲
- **レイアウトオプティマイザーではない**: 「より良い」レイアウトを探索せず、意図を忠実に翻訳
- **図表フレームワークではない**: レイアウトプリミティブを提供し、図表固有のセマンティクスは提供しない

## ドメイン駆動設計の観点

### ドメインレイヤー

```
┌─────────────────────────────────────────────────────┐
│      レイアウトセマンティクス (コアドメイン)         │
│  • 配置、間隔、グループ化、階層、フロー              │
│  • 人間志向のレイアウト語彙                          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│   制約翻訳 (コアドメイン - エンジン)                 │
│  • セマンティクス → 制約方程式                       │
│  • 翻訳ルールとパターン                              │
│  • 組み合わせと競合解決                              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│      サポートドメイン                                │
│  • 型安全なDSL (流暢なビルダー、IntelliSense)        │
│  • シンボルモデル (レイアウトオブジェクト、プロパティ)│
│  • テストフレームワーク (翻訳検証)                   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│      汎用サブドメイン (インフラストラクチャ)         │
│  • Cassowaryソルバー (制約解決)                      │
│  • SVGレンダリング (視覚出力)                        │
│  • ビルド & ツール (TypeScript、テスト、バンドリング)│
└─────────────────────────────────────────────────────┘
```

## コアドメイン: レイアウトセマンティクス → 制約翻訳

### 入力言語: レイアウト語彙

レイアウト語彙は、人間のレイアウト意図を表現するセマンティックカテゴリーで構成されます:

#### 1. 配置セマンティクス
- **水平**: left, center, right, justify
- **垂直**: top, middle, bottom, baseline
- **参照**: 他の要素、コンテナ、ガイドへの配置

**例**:
```typescript
// セマンティック意図
align(box).left.to(container.left);
align(box).center.to(container.center);
align([box1, box2, box3]).top();
```

#### 2. 間隔セマンティクス
- **固定**: 要素間の正確な距離
- **比例**: 比率に基づく相対的な間隔
- **最小/最大**: 制約された範囲

**例**:
```typescript
// セマンティック意図
space(box1, box2).horizontal(20);
space(boxes).distribute.evenly();
space(box).from(container).min(10);
```

#### 3. グループ化セマンティクス
- **コンテナ**: 境界ボックスの関係
- **クラスタ**: 近接性に基づくグループ化
- **レイヤー**: z順序と包含

**例**:
```typescript
// セマンティック意図
contain(box).within(container);
group([box1, box2]).as('cluster');
```

#### 4. 階層セマンティクス
- **親子**: 包含関係
- **フロー**: 方向性のある関係 (above, below, before, after)
- **ネスト**: 再帰的な包含

**例**:
```typescript
// セマンティック意図
box1.above(box2);
box2.inside(container);
flow([box1, box2, box3]).vertical();
```

#### 5. バランスセマンティクス
- **分布**: 均等な間隔、等しいサイズ
- **対称**: ミラー関係
- **重み**: 比例配分

**例**:
```typescript
// セマンティック意図
distribute(boxes).horizontally().evenly();
balance(box1, box2).around(centerLine);
```

### 出力言語: 制約方程式

翻訳エンジンはセマンティクスをCassowary制約に変換します:

#### 制約の種類:
- **等式制約**: `variable = expression`
- **不等式制約**: `variable >= expression`, `variable <= expression`
- **強度修飾子**: required, strong, medium, weak
- **組み合わせ演算子**: AND、優先順位付け

### 翻訳ルールと例

#### ルール1: 左揃え
**セマンティック**: `align(box).left.to(container.left)`

**翻訳**:
```typescript
// 制約方程式
box.x == container.x  [strength: required]
```

#### ルール2: 水平中央揃え
**セマンティック**: `align(box).center.to(container.center)`

**翻訳**:
```typescript
// 制約方程式
box.x + box.width / 2 == container.x + container.width / 2  [strength: required]
```

#### ルール3: 固定水平間隔
**セマンティック**: `space(box1, box2).horizontal(20)`

**翻訳**:
```typescript
// 制約方程式
box2.x == box1.x + box1.width + 20  [strength: required]
```

#### ルール4: 均等分布
**セマンティック**: `distribute([box1, box2, box3]).horizontally().evenly()`

**翻訳**:
```typescript
// n個のボックスに対して、n-1個の間隔制約を作成
let spacing = (container.width - sum(box.widths)) / (n + 1);

box1.x == container.x + spacing  [strength: required]
box2.x == box1.x + box1.width + spacing  [strength: required]
box3.x == box2.x + box2.width + spacing  [strength: required]
```

#### ルール5: 垂直フロー
**セマンティック**: `flow([box1, box2, box3]).vertical(gap: 10)`

**翻訳**:
```typescript
// 順次制約
box2.y == box1.y + box1.height + 10  [strength: required]
box3.y == box2.y + box2.height + 10  [strength: required]
```

### 組み合わせパターン

#### パターン1: 配置と間隔の組み合わせ
```typescript
// セマンティック
align(box).center.to(container.center);
space(box).from(container.top).fixed(20);

// 翻訳: 連携して動作する複数の制約
box.y == container.y + 20  [required]
box.x + box.width/2 == container.x + container.width/2  [required]
```

#### パターン2: パディング付き階層的包含
```typescript
// セマンティック
contain(box).within(container).padding(10);

// 翻訳: 4つの不等式制約
box.x >= container.x + 10  [required]
box.y >= container.y + 10  [required]
box.x + box.width <= container.x + container.width - 10  [required]
box.y + box.height <= container.y + container.height - 10  [required]
```

#### パターン3: 強度による競合解決
```typescript
// セマンティック: 中央を優先するが、境界内に留まる
align(box).center.to(container.center).strength('strong');
contain(box).within(container).strength('required');

// 翻訳: required制約が優先される
box.x >= container.x  [required]
box.x + box.width <= container.x + container.width  [required]
box.x + box.width/2 == container.x + container.width/2  [strong]
// 競合時、ソルバーはrequired制約を優先して満たす
```

## サポートドメイン

### 1. 型安全なDSL
**目的**: レイアウトセマンティクスのための開発者フレンドリーなAPIサーフェス

**責任**:
- セマンティック表現のための流暢なビルダーパターン
- セマンティック妥当性のTypeScript型チェック
- 発見可能性のためのIntelliSenseサポート
- プラグインシステムのための名前空間の整理

**例**:
```typescript
import { layout } from 'kiwumil';

layout()
  .align(box).center.to(container)
  .space(box1, box2).horizontal(20)
  .build();
```

### 2. シンボルモデル
**目的**: レイアウトオブジェクトの抽象表現

**責任**:
- レイアウトプロパティの定義 (x, y, width, height)
- シンボル関係の追跡
- Cassowaryへの変数バインディングの管理

**例**:
```typescript
class LayoutSymbol {
  x: Variable;
  y: Variable;
  width: Variable;
  height: Variable;
  
  // 導出プロパティ
  get centerX() { return this.x + this.width / 2; }
  get centerY() { return this.y + this.height / 2; }
  get right() { return this.x + this.width; }
  get bottom() { return this.y + this.height; }
}
```

### 3. テストフレームワーク
**目的**: セマンティック翻訳の正確性を検証

**責任**:
- 個別の翻訳ルールのユニットテスト
- セマンティック不変条件のプロパティベーステスト
- 組み合わせパターンの統合テスト
- 解決されたレイアウトのリグレッションテスト

## 汎用サブドメイン (インフラストラクチャ)

### 1. Cassowary制約ソルバー
**役割**: 制約システムを解決するためのインフラストラクチャ

**Kiwumilが行わないこと**:
- Cassowaryアルゴリズムの修正
- 解決パフォーマンスの最適化
- 代替ソルバーの実装

**Kiwumilが行うこと**:
- 正しい制約方程式の生成
- 適切な強度値の設定
- ソルバーAPIとの相互作用の処理

### 2. SVGレンダリング
**役割**: 視覚出力のためのインフラストラクチャ

**Kiwumilが行わないこと**:
- カスタムレンダリングロジックの実装
- レンダリングパフォーマンスの最適化
- スタイリング機能の提供

**Kiwumilが行うこと**:
- 解決された変数値のSVGへの適用
- レイアウト結果に基づくDOMの更新
- レイアウトとレンダリングの橋渡し

### 3. ビルド & ツール
**役割**: 開発のためのインフラストラクチャ

**責任**:
- TypeScriptコンパイル
- テストインフラストラクチャ
- パッケージ管理
- ドキュメント生成

## 重要な洞察: Kiwumilの価値提案

### Kiwumilが価値を提供するもの

1. **セマンティック抽象化**: 直感的なレイアウト語彙の背後に制約の複雑さを隠す
2. **翻訳の正確性**: セマンティクスが正しい制約にマッピングされることを保証
3. **組み合わせ**: レイアウトルールを予測可能に組み合わせることを可能にする
4. **型安全性**: セマンティックエラーを実行時ではなくコンパイル時に捕捉
5. **開発者体験**: 制約ベースのレイアウトを扱いやすくする

### Kiwumilの仕事でないもの

1. **解決**: それはCassowaryの仕事
2. **レンダリング**: それはSVG/Canvas/WebGLの仕事
3. **最適化**: 意図を忠実に翻訳し、推測しない
4. **図表ロジック**: レイアウトプリミティブを提供し、ドメイン固有の機能は提供しない

### 翻訳エンジンのメタファー

Kiwumilをコンパイラとして考えてください:

- **ソース言語**: レイアウトセマンティクス (人間志向)
- **ターゲット言語**: 制約方程式 (ソルバー志向)
- **コンパイラ**: 翻訳ルールとパターン
- **ランタイム**: Cassowaryソルバー

コンパイラの価値が正確な翻訳にある (CPUアーキテクチャやアセンブリ最適化ではない) のと同様に、Kiwumilの価値は正確なセマンティック翻訳にあります (解決アルゴリズムやレンダリング技術ではありません)。

## 設計原則

1. **セマンティクス駆動**: すべてのAPIは実装詳細ではなく、セマンティック意図を表現すべき
2. **翻訳第一**: セマンティックから制約へのマッピングの正確性に焦点を当てる
3. **組み合わせ可能**: レイアウトセマンティクスは特別扱いなしに組み合わせ可能であるべき
4. **宣言的**: 方法ではなく、何を表現するか
5. **ソルバー非依存**: 理論的にはCassowaryを別のソルバーに交換可能
6. **最小限**: すべての可能な機能ではなく、本質的なレイアウト語彙を提供

## コードベースへの参照

- **セマンティクス**: `src/hint/` (歴史的、リファクタリングされる可能性あり)
- **DSL**: `src/dsl/` (ビルダーパターン、流暢なAPI)
- **翻訳**: コアエンジン (v0.2.0で実装予定)
- **テスト**: `test/` (翻訳検証テスト)

## バージョン履歴

- **v0.2.0**: ドメイン翻訳エンジンとしてのコアドメインの明確化
- 以前のバージョンは混合した懸念事項に焦点を当てていた (レンダリング + レイアウト + 制約)
