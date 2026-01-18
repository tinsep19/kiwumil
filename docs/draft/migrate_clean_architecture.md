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
      
    
