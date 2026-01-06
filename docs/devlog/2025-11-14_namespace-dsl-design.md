# 開発ログ: Namespace-Based DSL 設計 (2025-11-14)

## 実施内容

### 1. 設計仕様書の作成
`docs/design/namespace-dsl.md` を作成し、Namespace-Based DSL の全体設計をドキュメント化した。

### 2. 主要な設計決定

#### 2.1 Factory の戻り値の明確化
- **Symbol Factory**: `SymbolId` を返す
  - 既存コードとの整合性を保つため
  - ユーザーは ID を使って Symbol を参照
  
- **Relationship Factory**: `RelationshipId` を返す
  - Relationship にも一意な識別子を持たせる
  - 将来的な拡張（Relationship の参照、更新など）に対応

#### 2.2 生成と管理の責務統合
Factory の役割を以下のように定義：

```typescript
createSymbolFactory(userSymbols: SymbolBase[]) {
  const namespace = this.name  // 例: 'uml'
  let counter = 0
  return {
    actor(label: string): SymbolId {
      const id = `${namespace}:actor-${counter++}` as SymbolId  // 例: "uml:actor-0"
      const symbol = new ActorSymbol(id, label)
      userSymbols.push(symbol)  // 生成と登録を担当
      return id
    }
  }
}

createRelationshipFactory(relationships: RelationshipBase[]) {
  const namespace = this.name  // 例: 'uml'
  let counter = 0
  return {
    associate(from: SymbolId, to: SymbolId): RelationshipId {
      const id = `${namespace}:association-${counter++}` as RelationshipId  // 例: "uml:association-0"
      const rel = new Association(id, from, to)
      relationships.push(rel)  // 生成と登録を担当
      return id
    }
  }
}
```

**メリット**:
- Symbol/Relationship の生成と管理が一箇所に集約
- DiagramBuilder.layout() がシンプルになる
- プラグインが完全に自己完結
- Relationship にも ID を持たせることで、将来的な拡張性を確保

#### 2.3 RelationshipId の導入理由
- ユーザーからの要望：Relationship も ID を返してほしい
- 将来的な用途：
  - Relationship の参照・更新
  - Relationship に対する hint の適用
  - Relationship のグループ化
  - デバッグ・ロギング

#### 2.4 RelationshipBase の変更
```typescript
abstract class RelationshipBase {
  readonly id: RelationshipId  // 追加
  protected theme?: Theme

  constructor(
    id: RelationshipId,        // 追加
    public from: SymbolId,
    public to: SymbolId
  ) {
    this.id = id
  }

  // ...
}
```

#### 2.5 ID の命名規則
ID は以下の形式で生成される：
```
${namespace}:${symbolName|relationshipName}-${serial}
```

**例**:
- Symbol ID: `uml:actor-0`, `uml:usecase-1`, `sequence:lifeline-0`
- Relationship ID: `uml:association-0`, `uml:include-1`, `sequence:message-0`

**メリット**:
- デバッグ時にどのプラグインで生成されたかが一目でわかる
- Symbol/Relationship の種類が明確
- プラグイン間で ID が衝突しない
- ログやエラーメッセージでの可読性が向上

#### 2.6 カウンター管理
- 各プラグインの Factory 生成関数内でカウンターを管理
- Symbol と Relationship でそれぞれ独立したカウンター（0 から開始）
- プラグインごとに独立したカウンター
- 名前空間プレフィックスにより ID の衝突が完全に防止される

### 3. 型システムの設計

#### 3.1 型定義の追加
```typescript
type SymbolId = string & { readonly __brand: 'SymbolId' }
type RelationshipId = string & { readonly __brand: 'RelationshipId' }
```

#### 3.2 型ユーティリティ
```typescript
type BuildElementNamespace<TPlugins> = {
  [K in TPlugins[number]['name']]: ReturnType<
    Extract<TPlugins[number], { name: K }>['createSymbolFactory']
  >
}

type BuildRelationshipNamespace<TPlugins> = {
  [K in TPlugins[number]['name']]: ReturnType<
    Extract<TPlugins[number], { name: K }>['createRelationshipFactory']
  >
}
```

#### 3.3 DiagramBuilder のジェネリクス
```typescript
class DiagramBuilder<TPlugins extends readonly DiagramPlugin[]> {
  use<TNewPlugins>(...plugins: TNewPlugins): 
    DiagramBuilder<[...TPlugins, ...TNewPlugins]>
}
```

プラグイン追加時に型が拡張される。

### 4. DiagramPlugin インターフェース

```typescript
interface DiagramPlugin {
  name: string
  createSymbolFactory(userSymbols: SymbolBase[]): 
    Record<string, (...args: any[]) => SymbolId>
  createRelationshipFactory(relationships: RelationshipBase[]): 
    Record<string, (...args: any[]) => RelationshipId>
}
```

**設計意図**:
- Factory 生成関数が配列を受け取る
- 配列への登録を Factory が担当
- 戻り値は SymbolId または RelationshipId

### 5. NamespaceBuilder の実装方針

```typescript
class NamespaceBuilder<TPlugins> {
  buildElementNamespace(userSymbols: SymbolBase[]) {
    const namespace = {}
    for (const plugin of this.plugins) {
      namespace[plugin.name] = plugin.createSymbolFactory(userSymbols)
    }
    return namespace
  }
  
  buildRelationshipNamespace(relationships: RelationshipBase[]) {
    const namespace = {}
    for (const plugin of this.plugins) {
      namespace[plugin.name] = plugin.createRelationshipFactory(relationships)
    }
    return namespace
  }
}
```

**特徴**:
- プラグイン一覧から名前空間オブジェクトを構築
- 各プラグインに同じ配列参照を渡す
- すべてのプラグインが同じ配列に Symbol/Relationship を追加

### 6. マイグレーションパス

#### Phase 1: 新 API の実装
- [ ] `RelationshipId` 型の定義
- [ ] `RelationshipBase` に `id` フィールドを追加
- [ ] `DiagramPlugin` インターフェースの定義
- [ ] `NamespaceBuilder` の実装
- [ ] 型ユーティリティの実装

#### Phase 2: プラグインの移行
- [ ] 既存の Relationship クラスを更新（コンストラクタに id を追加）
- [ ] `UMLPlugin` を新形式に変換
- [ ] `CorePlugin` を新形式に変換

#### Phase 3: Builder の移行
- [ ] 新しい `DiagramBuilder` の実装
- [ ] 既存 API の維持

#### Phase 4: 旧 API の削除
- [ ] `ElementFactory` の削除
- [ ] `RelationshipFactory` の削除
- [ ] `PluginManager` の削除

## 設計上の重要なポイント

### IntelliSense の最大活用
- `el.` で自動補完 → プラグイン名が表示
- `el.uml.` で自動補完 → UML のメソッドが表示
- 型エラーがリアルタイムで検出

### 型安全性の徹底
- `any` の排除
- Mapped Types と Generics の活用
- `satisfies` オペレータの使用
- SymbolId と RelationshipId の型ブランディング

### 拡張性の確保
- 新しいプラグインの追加が容易
- プラグイン間の依存関係のサポート（将来）
- 名前空間の衝突を防止
- Relationship に ID を持たせることで将来的な機能拡張に対応

## RelationshipId 導入による影響

### 変更が必要な箇所
1. `src/model/types.ts` - RelationshipId 型の追加
2. `src/model/relationship_base.ts` - id フィールドとコンストラクタの変更
3. すべての Relationship クラス - コンストラクタの変更
4. Relationship を生成しているすべての箇所 - ID 生成ロジックの追加

### メリット
- Relationship の一意な識別が可能
- デバッグ時に Relationship を特定しやすい
- 将来的な機能拡張（Relationship の参照、更新など）に対応

## 次のステップ

1. `RelationshipId` 型の定義
2. `RelationshipBase` の更新
3. 既存の Relationship クラスの更新
4. 型ユーティリティの実装とテスト
5. `NamespaceBuilder` の実装
6. `UMLPlugin` を新形式に変換
7. `DiagramBuilder.layout()` の書き換え
8. 既存テストの実行と修正

## 参考資料

- TypeScript 5.x Mapped Types
- Const Type Parameters
- Satisfies Operator
- Brand Types (Nominal Typing)
- 既存の `ElementFactory` / `RelationshipFactory` 実装
