import type { VariableId } from "@/core/types"

/**
 * Variable Entity
 * 
 * レイアウト変数を表す Entity。
 * new で作成可能で、後から Solver に登録できる。
 * 
 * Solver に登録すると、Kiwi の Variable と1対1対応する。
 * 
 * @example
 * const x = new Variable("actor1.x")
 * const y = new Variable("actor1.y")
 * 
 * solver.addVariable(x)
 * solver.addVariable(y)
 * 
 * solver.solve()
 * 
 * console.log(x.value())  // 計算された値
 */
export class Variable {
  private _id: VariableId
  private _value: number = 0
  
  constructor(id: VariableId) {
    this._id = id
  }
  
  /**
   * Variable の ID を取得
   */
  id(): VariableId {
    return this._id
  }
  
  /**
   * Variable の現在値を取得（Solver が計算した値）
   */
  value(): number {
    return this._value
  }
  
  /**
   * Variable の値を設定（Solver が呼ぶ）
   * 
   * @internal
   */
  setValue(value: number): void {
    this._value = value
  }
}
