# Clean Architecture / DDD への移行

## 背景、問題点

現在、コードがsrc内に散在しており、ある程度のレイヤー構成があるが
特に src/core, src/model に主要なコードがあるものの、うまく整理できていない。

そのため以下のように変更する

- src
  - domain
    - entity
        
      - layout_constraint.ts
        線形制約を複数用いてダイアグラムでの配置を表現する
        現在のところ、以下が想定されている
        - GeometricConstraint: 幾何的な制約を表す
        - UserHintConstraint: ユーザーが指示する配置のためのヒントを表す
        - SymbolInternalConstraint: Symbolが内部
        以下のような実装を考えている
        ```
        class LayoutConstraint<T extends ConstraintType> {
          private _constraints: LinearConstraint[] = []
          constructor(
            readonly id: ConstraintId
            readonly type: T
            private registrar: ConstraintRegistrar
          ) { }
          get constraints() {
            return [...this._constraints]
          }
          addConstraint(spec: ConstraintSpec) {
            const registered = this.registrar.createConstraints(spec)
            this._constraints.push(...registered)
          }
          clear() {
            while (this._constraints.length > 0) {
              const ct = this._constraints.shift()
              ct.dispose()
            }
          }
          compact() {
            const registered = []
            while (this._constraints.length > 0) {
              const ct = this._constraints.shift()
              if (ct.registered()) {
                registered.push(ct)
              }
            }
            this._constraints.push(...registered)
          }
        }          
        ```
        
      - layout_variable.ts
        Cassowaryアルゴリズムの変数に配置上の意味を与えたもの
        - AnchorX, AnchorY, AnchorZ (x座標、y座標、z座標)
        - Width, Height (幅、高さ)
        - Anchor: { x: AnchorX, y: AnchorY } で示される位置であり、視覚表現が元になるもの
          特に矩形においては以下を用いて配置指示を特定する(これらはdiscreminated union)
          - CenterAnchor
          - TopLeftAnchor
          - TopRightAnchor
          - BottomLeftAnchor
          - BottomRightAnchor
          - CenterLeftAnchor
          - CenterRightAnchor
          - TopCenterAnchor
          - BottomCenterAnchor

      - plane_variable.ts
        Cassowaryアルゴリズムの変数に配置用の基準となる意味を与えたもの
        - GuideX, GuideY, LinearGuide
          無限直線や軸に対する束縛を行うことができる
          LinearGuideは ax + by + c = 0 となる制約を用いて、
          Anchorをこの直線上に配置するために用いる
          GuideX, GuideYはLinearGuideの単純実装
        - GridArea
          矩形領域をN*Mのグリッドに分割し、離散領域を指定できる

      - bounds.ts
        配置のための矩形領域をLayoutVariableとLayoutConstraintを用いて表現したもの
        top(= y), left(= x), width, height, bottom(= y + height), right(= x + width)
        であるような変数及び制約を持ち、必要に応じてcenterなども作成/保持する
        ```
          class Bounds {
            id: BoundsId
            readonly x: AnchorX
            readonly y: AnchorY
            readonly left: AnchorX
            readonly right: AnchorX
            readonly top: AnchorY
            readonly bottom: AnchorY
            readonly width: Width
            readonly height: Height
            
            private _center?: CenterAnchor

            private factory: VariableFactory
            private constraint: GeometricConstraint
            
            get center(): CenterAnchor {
              if (this._center) {
                return this._center
              }
              const cx = this.factory.createAnchorX(`${this.id}#center.x`)
              const cy = this.factory.createAnchorY(`${this.id}#center.y`)
              this.constraint.addConstraint(ct => {
                ct([1, this.left], [1,this.right ]).eq([2, cx]).required()
                ct([1, this.top ], [1,this.bottom]).eq([2, cy]).required()
              })
              this._center = toCenterAnchor({ x: cx, y: cy })
              return this._center
            }
            get topLeft(): TopLeftAnchor {
              return toTopLeftAnchor({ x: this.left, y: this.top })
            }
            ...
          }
        ```

      - item
        アイテムは標準で提供されるコンポーネントであり、これらを使用して
        描画を再利用することができる
        テキスト、矩形、円、楕円、アイコンが用意される
        - text_item.ts
        - icon_item.ts
        - ellipse_item.ts
        - rect_item.ts
        - circle_item.ts
          
      - hints
        配置位置を決めるためのヒントを示すエンティティ
        - alignment_hint.ts
        - grid_layout_hint.ts
        - anchor_layout_hint.ts
      - icon
        - icon_ref.ts
          アイコンの参照(height, width, viewportなど含む)

    - service
      - variable_factory.ts
        ports/solver.ts を使用して、変数を作成し、LayoutVariableとして生成する
        
      - constraint_registrar.ts
        ports/solver.ts を使用して、LinearConstraintとして登録/生成する
        
    - ports

      - symbol.ts
        「要素」が実装すべきインターフェース(ISymbol)を定義する
        実体はプラグインから提供される
        「要素」はテキスト、アイコン、楕円、矩形などからなる複合コンポーネントであり、
        プラグインが提供するセマンティックなコンポーネント
        配置を行うときに使用できるものをcharacsを通して提供する
        
        ```
        interface ISymbol<T> {
          id: SymbolId
          characs: ISymbolCharacs<T>
          getConnectionPoint(src: Point) : Point
          render() : RenderModel
        }
        ```

      - relationship.ts
        「関連」が実装すべきインターフェース(IRelationship)を定義する
        実体はプラグインから提供される
        「関連」は「要素」間の関係性である。視覚表現をもち、主に矢印や線で示される。
        多重度や集約、ステレオタイプなどを示すアノテーションが存在する場合もある
        配置を行うときに使用できるものをcharacsを通して提供する

        ```
        interface IRelationship<T> {
          id: RelationshipId
          characs: IRelationshipCharacs<T>
          render() : RenderModel
        }
        ```

      - solver.ts
        Cassowaryアルゴリズムを抽象化し、infrastructure から Inject するためのインターフェース
        線形制約はあとで評価可能なように実装する
        ```
          interface ConstraintExpr {
            lhs: Term[],
            rhs: Term[],
            op: ConstraintOperator,
            strength: ConstraintStrength,
          }
          // Fluent APIで ct(...lhs).eq(...rhs).strong() のような形で作成/登録できるようにする

          interface LinearConstraint {
            readonly strength: ConstraintStrength
            isSatisfied():boolean
            isRegistered():boolean
            dispose():void
          }
          
        ```

      - icon_provider.ts
        アイコンの参照を返すためのインターフェース

        ```
        type IconProvider =  () => IconRef;
        ```

      - renderer.ts
        SVGでの描画結果を書き出すためのインターフェース仕様
        
      
  - application
      
      - layout_context.ts
        図を作成するために必要となるサービスをまとめたサービスロケータ

      - symbol_registry.ts
        プラグインが作成した「要素」を登録/管理するレジストリ

      - relationship_registry.ts
        プラグインが作成した「関連」を登録/管理するレジストリ

      - icon_registry.ts
        プラグインが作成したアイコンを登録/管理するためのレジストリ
        
      - icon_asset.ts
        アイコンの実体
        
    - hint
      - hint_factory.ts
        レイアウトヒントを作成するためのfluent style DSLを提供する

    - plugin.ts
      プラグインが実装、利用すべきインターフェースを定義/提供する
      プラグインはセマンティックな語彙を提供するための機構であり、
      Symbol/Relationshipの実体を提供するためSymbolFactory, RelationshipFactory,
      IconProviderを提供する
      これらをユーザーが利用することでダイアグラム内でシンボルを作成できる

    - usecase
      - CreateDiagramContextUsecase
        - 入力: CassowarySolverの抽象、テーマ
        - 出力: LayoutContext

      - LoadPluginsUsecase
        プラグインを読み込んで名前空間でわけた複合ファクトリーを作成する
        - 入力: ユーザーが指定した DiagramPlugin[], LayoutContext
        - 出力: el/rel/icon ユーザーが利用する複合ファクトリ

      - BuildDiagramUsecase
        ユーザーのダイアグラム作成仕様を実行するための準備として
        hintの作成、タイトル/著者などを含むDiagramSymbolの作成を行い
        ダイアグラム作成仕様を実行し、solveする
        - 入力:
          - diagramInfo (図のタイトル、著者、作成日などの情報)
          - ダイアグラム作成仕様 `type DiagramSpec =  ({el,rel,hint,icon}) => void`
          - LayoutContext
        - 出力: 仕様反映済み/計算済みのLayoutContext
        - 副作用: DiagramSpecの実行によりsymbol/relationship/icon registryに必要なもの登録済
        
        
      - RenderUsecase
        作成したダイアグラムをファイルやブラウザに書き出す
        - 入力: LayoutContext + target
        - 出力: なし
        - 副作用 : SVGRendererからstring(SVG)を生成し、target.output(string) で対象に書き出す

  - infrastructure
    - kiwi
      https://github.com/lume/kiwiを使用したsolver.tsのインターフェース実装
      ```
      
        class LinearConstraintImpl implements LinearConstraint {
          private expr: ConstraintExpr
          private registered: boolean
          
          private solver: kiwi.Solver
          private rawConstraint?: kiwi.Constraint
          
          isRegistered() : boolean {
            return this.registered
          }
          isSatisfied() : boolean {
            // reduce()はTerm[]を評価してスカラー値をもとめる関数
            const lhs = reduce(this.expr.lhs)
            const rhs = reduce(this.expr.rhs)

             // a = LHS - RHS を計算して判定します。
             // - まず許容幅を作る
             //   - absTol = 1e-6（固定）
             //   - relTol = 1e-9（固定）
             //   - scale = max(1, |LHS|, |RHS|)
             //   - tol = absTol + relTol * scale
             // - 判定
             //   - eq: |a| <= tol
             //   - le: a <= tol（= LHS <= RHS + tol）
             //   - ge: a >= -tol（= LHS + tol >= RHS）
          }
          dispose() : void {
            if (!this.registered) {
              return
            }
            const ct = this.rawConstraint
            this.solver.removeConstraint(ct)
            this.registered = false
            this.rawConstraint = undefined
          }
        }
      ```

    - render
      - file_renderer.ts
        SVGの描画結果をファイルに書き出すためのインターフェース実装

    - icon
      - icon_loader.ts
        ファイルからSVGを読み込み IconRegistryへのIconAssetの登録、IconRefの生成を行う
        IconProviderの実体

  - presentation
    - dsl
      エントリーポイントとなるTypeDiagram関数およびFluent APIを実装するBuilder
      Builderによってユーザーは使用するプラグイン、作成するダイアグラムのメタデータ
      作成したいダイアグラムの仕様とその出力先を指定します。
      (現在のところ予定はありませんが、CassowarySolverの実体として
      KiwiSolver以外を指定する場合もここを拡張します)
      
    - namespace-dsl
      プラグインが提供する語彙/アイコンを名前空間で分けて、
      型情報とともにユーザーに提供する

## 移行ステップ

既存のコードを段階的に新しい構造へ移行していきます。ストラングラーパターンを採用し、テストを壊さないように再エクスポートを活用します。

### 0. 準備

- 現在のテストがすべてパスすることを確認
- git の作業ブランチを作成

### 1. Composition Root の確定

- `src/dsl/diagram_builder.ts` の実装を `src/presentation/dsl/diagram_builder.ts` へ移動
- 旧パス `src/dsl/diagram_builder.ts` は再エクスポート専用ファイルとして残す
  ```typescript
  // src/dsl/diagram_builder.ts (旧パスに残す再エクスポート)
  export { TypeDiagram } from '../presentation/dsl/diagram_builder'
  ```
- `TypeDiagram` 関数は `src/index.ts` → `src/presentation/index.ts` 経由で再エクスポート
- **重要**: コピーではなく移動すること。二重メンテナンスを避けるため

### 2. 新しいディレクトリ構造の作成

以下のディレクトリを作成:

```
src/
  domain/
    entity/
    service/
    ports/
  application/
    usecase/
  infrastructure/
    kiwi/
    render/
    icon/
  presentation/
    dsl/
    namespace-dsl/
```

### 3. Ports の定義

`src/domain/ports/` 配下にインターフェースを作成:

- `solver.ts`: CassowarySolver の抽象化
  - `ConstraintExpr`, `LinearConstraint`, `VariableFactory`, `ConstraintRegistrar` など
- `symbol.ts`: `ISymbol` インターフェース
- `relationship.ts`: `IRelationship` インターフェース
- `renderer.ts`: レンダラーのインターフェース
- `icon_provider.ts`: `IconProvider = () => IconRef`

### 4. Domain Entity の実装

`src/domain/entity/` 配下に以下を実装:

- `layout_variable.ts`: 既存の `src/core/layout_variable.ts` をベースに移動
- `plane_variable.ts`: GuideX/GuideY/GridArea
- `layout_constraint.ts`: `LayoutConstraint<T>` クラス
- `bounds.ts`: 既存のコードをベースに移動・整理
- `icon/icon_ref.ts`: アイコン参照（domain は参照のみ）
- `item/`: 既存の `src/item/` から移動

### 5. Domain Service の実装

`src/domain/service/` 配下に:

- `variable_factory.ts`: Ports の solver を使用して変数を作成
- `constraint_registrar.ts`: Ports の solver を使用して制約を登録

### 6. Infrastructure の実装

`src/infrastructure/kiwi/` に既存の Kiwi 実装を移動:

- 既存の `src/kiwi/` のファイルを移動
- `LinearConstraintImpl` クラスで `ConstraintExpr` を保持し、`isSatisfied()` を実装
- Tolerance ロジック（abs + rel）を追加

`src/infrastructure/icon/` に:

- 既存の `src/icon/icon_loader.ts` を移動
- `IconAsset` と `IconRegistry` は `src/application/` に配置

`src/infrastructure/render/` に:

- 既存の `src/render/` から移動

### 7. Application Layer の実装

`src/application/` 配下に:

- `layout_context.ts`: 既存の `src/model/layout_context.ts` をベースに移動
- `symbol_registry.ts`, `relationship_registry.ts`: 既存の `src/model/` から移動
- `icon_registry.ts`, `icon_asset.ts`: アイコンのアプリケーション層実装
- `plugin.ts`: プラグインインターフェース（既存の `src/dsl/diagram_plugin.ts` から移動）

`src/application/usecase/` に以下の Usecase を実装:

- `create_diagram_context.ts`: `CreateDiagramContextUsecase`
- `load_plugins.ts`: `LoadPluginsUsecase`
- `build_diagram.ts`: `BuildDiagramUsecase`
- `render.ts`: `RenderUsecase`

### 8. Presentation Layer の整理

`src/presentation/dsl/` に:

- ステップ 1 で移動した `diagram_builder.ts`
- 既存の `src/dsl/` から他の必要なファイルを移動

`src/presentation/namespace-dsl/` に:

- 既存の `src/dsl/namespace_builder.ts`, `namespace_types.ts` を移動

### 9. 再エクスポートの整理

各旧パスに再エクスポート用のファイルを配置:

```typescript
// src/model/index.ts (例)
export * from '../application/layout_context'
export * from '../application/symbol_registry'
// ...
```

`src/index.ts` を更新し、新しいパスからエクスポート:

```typescript
export { TypeDiagram } from './presentation'
export type { DiagramPlugin } from './application'
// ...
```

### 10. 段階的な移行

小さいコミット単位で移行:

1. まず Ports インターフェースのみ作成（破壊的変更なし）
2. Infrastructure 実装を新パスに移動、旧パスから再エクスポート
3. Domain Entity/Service を新パスに実装、既存コードから徐々に参照を変更
4. Application Layer 実装
5. Usecase 実装（最初は既存コードを薄くラップ）
6. Presentation の整理
7. 再エクスポートを段階的に削除（すべての参照が新パスになってから）

### 11. テストの確認

各ステップで `npm test` を実行し、すべてのテストがパスすることを確認:

```bash
npm test
```

### 12. 最終クリーンアップ

すべての移行が完了したら:

- 不要な再エクスポートを削除
- `docs/draft/migrate_clean_architecture.md` を `docs/design/clean_architecture.md` へ移動
- README.md を更新（必要に応じて）
    
