import type { ConstraintSpec, BoundsType } from "../core"
import type { LayoutVariables } from "./layout_variables"
import type { SymbolId, ISymbol, ISymbolCharacs, LayoutConstraint } from "../core"
import type { SymbolBase } from "./symbol_base"

/**
 * SymbolRegistration: register の戻り値型
 */
export type SymbolRegistration = {
  symbol: ISymbol
  characs: ISymbolCharacs
  constraint: LayoutConstraint
}

/**
 * SymbolRegistrationBuilder:
 * register コールバック内でシンボル登録に必要な情報（characs / symbol / constraint）を
 * 作成・設定するためのヘルパービルダー。
 *
 * createLayoutBounds/createContainerBounds/createItemBounds/createVariable は内部で LayoutVariables を使い、prefix 等に id を渡す想定。
 */
export class SymbolRegistrationBuilder {
  private readonly id: SymbolId
  private readonly variables: LayoutVariables

  private _characs?: ISymbolCharacs
  private _symbol?: ISymbol
  private _constraint?: LayoutConstraint

  constructor(id: SymbolId, variables: LayoutVariables) {
    this.id = id
    this.variables = variables
  }

  /**
   * key は ISymbolCharacsのプロパティ に相当
   * 自動的に id を与える（ユーザーは意識しなくて良い）
   * Creates bounds of type "layout"
   */
  createLayoutBounds(key: string) {
    return this.variables.createBounds(`${this.id}#${key}`, "layout")
  }

  /**
   * key は ISymbolCharacsのプロパティ に相当
   * 自動的に id を与える（ユーザーは意識しなくて良い）
   * Creates bounds of type "container"
   */
  createContainerBounds(key: string) {
    return this.variables.createBounds(`${this.id}#${key}`, "container")
  }

  /**
   * key は ISymbolCharacsのプロパティ に相当
   * 自動的に id を与える（ユーザーは意識しなくて良い）
   * Creates bounds of type "item"
   */
  createItemBounds(key: string) {
    return this.variables.createBounds(`${this.id}#${key}`, "item")
  }

  /**
   * key は ISymbolCharacsのプロパティ に相当
   * 自動的に id を与える（ユーザーは意識しなくて良い）
   */
  createVariable(key: string) {
    return this.variables.createVariable(`${this.id}#${key}`)
  }

  setCharacs(characs: ISymbolCharacs) {
    this._characs = characs
  }

  setSymbol(symbol: ISymbol) {
    this._symbol = symbol
  }

  /**
   * setConstraint を ConstraintSpec を受け取り LayoutConstraint を生成して返す仕様に変更しました。
   * Variables（または関連する変数管理オブジェクト）の createConstraint を呼び出して
   * this._constraint に保存します。
   */
  setConstraint(spec: ConstraintSpec): LayoutConstraint {
    // variables 側に createConstraint(id, spec) がある前提
    const constraint = this.variables.createConstraint(this.id, spec)
    this._constraint = constraint
    return constraint
  }

  build(): SymbolRegistration {
    if (!this._characs) throw new Error("SymbolRegistrationBuilder: characs not set")
    if (!this._symbol) throw new Error("SymbolRegistrationBuilder: symbol not set")
    if (!this._constraint) throw new Error("SymbolRegistrationBuilder: constraint not set")
    return {
      symbol: this._symbol,
      characs: this._characs,
      constraint: this._constraint,
    }
  }
}

/**
 * Symbol 管理クラス
 *
 * - Symbol の収集と ID 生成を一元化する
 * - プラグインは register のコールバック内で SymbolRegistrationBuilder を使って
 *   シンボルを構築して返す
 */
export class Symbols {
  private readonly registrations: SymbolRegistration[] = []
  private readonly registrations_index: Record<string, SymbolRegistration> = {}
  private readonly variables: LayoutVariables

  constructor(variables: LayoutVariables) {
    this.variables = variables
  }

  /**
   * 指定したプラグインによる Symbol を登録し、登録結果 (SymbolRegistration) を返す。
   *
   * factory は (symbolId, builder) => SymbolRegistration を返す。
   * builder は createLayoutBounds/createContainerBounds/createItemBounds/createVariable/setCharacs/setSymbol/setConstraint/build を持つ。
   */
  register(
    plugin: string,
    symbolName: string,
    factory: (symbolId: SymbolId, builder: SymbolRegistrationBuilder) => SymbolRegistration
  ): SymbolRegistration {
    const symbolId = this.createSymbolId(plugin, symbolName)
    const builder = new SymbolRegistrationBuilder(symbolId, this.variables)
    const registration = factory(symbolId, builder)

    // 検証: registration.symbol.id が生成した id と一致することを期待する
    if (registration.symbol.id !== symbolId) {
      // ここは厳密にするか緩めるかは方針次第。まずは警告的に例外を投げる。
      throw new Error(
        `Symbol registration id mismatch: expected ${symbolId}, got ${String(
          registration.symbol.id
        )}`
      )
    }

    this.registrations.push(registration)
    this.registrations_index[symbolId] = registration
    return registration
  }

  /**
   * 登録済み SymbolRegistration を列挙する読み取り専用配列
   */
  getAll(): readonly SymbolRegistration[] {
    return this.registrations
  }

  /**
   * 登録済み Symbol (SymbolBase) を列挙する読み取り専用配列
   * 後方互換性のため、SymbolBase として返す
   */
  getAllSymbols(): readonly SymbolBase[] {
    return this.registrations.map((reg) => reg.symbol as SymbolBase)
  }

  /**
   * 指定した ID に一致する SymbolRegistration を返す（存在しなければ undefined）
   */
  findById(id: SymbolId): SymbolRegistration | undefined {
    return this.registrations_index[id]
  }

  /**
   * 指定した ID に一致する Symbol (SymbolBase) を返す（存在しなければ undefined）
   * 後方互換性のため、SymbolBase として返す
   */
  findSymbolById(id: SymbolId): SymbolBase | undefined {
    const registration = this.registrations_index[id]
    return registration?.symbol as SymbolBase | undefined
  }

  /**
   * 登録済み Symbol の数
   */
  get size(): number {
    return this.registrations.length
  }

  private createSymbolId(plugin: string, symbolName: string): SymbolId {
    const idIndex = this.registrations.length
    return `${plugin}:${symbolName}/${idIndex}` as SymbolId
  }
}
