import type { SymbolId } from "@/core/types"
import { Variable } from "./variable"
import { ct } from "@/dsl/constraint-dsl"
import type { LinearConstraint } from "./linear-constraint"

/**
 * ISymbol: シンボルの基本インターフェース
 */
export interface ISymbol {
  readonly id: SymbolId
  getVariables(): Variable[]
  getConstraints(): readonly LinearConstraint[]
  render(): string
}

/**
 * ActorSymbol: Domain Entity として Actor を表す
 * 
 * Variable と LinearConstraint を所有する Aggregate Root。
 * Solver への登録は SymbolFactory が行う（Symbol は Solver に依存しない）。
 * 
 * @example
 * const actor = new ActorSymbol("actor1", "User")
 * 
 * // SymbolFactory が Solver に登録
 * for (const variable of actor.getVariables()) {
 *   solver.addVariable(variable)
 * }
 * for (const constraint of actor.getConstraints()) {
 *   solver.addConstraint(constraint)
 * }
 */
export class ActorSymbol implements ISymbol {
  readonly id: SymbolId
  private readonly label: string
  private readonly bounds: {
    x: Variable
    y: Variable
    width: Variable
    height: Variable
    right: Variable
    bottom: Variable
  }
  private readonly constraints: LinearConstraint[]
  
  constructor(id: SymbolId, label: string) {
    this.id = id
    this.label = label
    
    // Variable を new で作成
    this.bounds = {
      x: new Variable(`${id}.x`),
      y: new Variable(`${id}.y`),
      width: new Variable(`${id}.width`),
      height: new Variable(`${id}.height`),
      right: new Variable(`${id}.right`),
      bottom: new Variable(`${id}.bottom`),
    }
    
    // ct() DSL で Constraint を作成
    this.constraints = [
      ct([1, this.bounds.width]).eq([60, 1]).required(),
      ct([1, this.bounds.height]).eq([80, 1]).required(),
      ct([1, this.bounds.right]).eq([1, this.bounds.x], [1, this.bounds.width]).required(),
      ct([1, this.bounds.bottom]).eq([1, this.bounds.y], [1, this.bounds.height]).required(),
    ]
  }
  
  /**
   * すべての Variable を取得
   */
  getVariables(): Variable[] {
    return Object.values(this.bounds)
  }
  
  /**
   * すべての Constraint を取得
   */
  getConstraints(): readonly LinearConstraint[] {
    return this.constraints
  }
  
  /**
   * SVG として描画
   */
  render(): string {
    const x = this.bounds.x.value()
    const y = this.bounds.y.value()
    const width = this.bounds.width.value()
    const height = this.bounds.height.value()
    
    // Actor シンボル（棒人間）を描画
    const headRadius = width / 4
    const headY = y + headRadius + 5
    const bodyTop = headY + headRadius
    const bodyBottom = y + height - 10
    const armY = bodyTop + (bodyBottom - bodyTop) / 3
    const centerX = x + width / 2
    
    return `<g id="${this.id}">
  <!-- Head -->
  <circle cx="${centerX}" cy="${headY}" r="${headRadius}" fill="none" stroke="black" stroke-width="1.5"/>
  <!-- Body -->
  <line x1="${centerX}" y1="${bodyTop}" x2="${centerX}" y2="${bodyBottom}" stroke="black" stroke-width="1.5"/>
  <!-- Arms -->
  <line x1="${x + 5}" y1="${armY}" x2="${x + width - 5}" y2="${armY}" stroke="black" stroke-width="1.5"/>
  <!-- Legs -->
  <line x1="${centerX}" y1="${bodyBottom}" x2="${x + 5}" y2="${y + height - 2}" stroke="black" stroke-width="1.5"/>
  <line x1="${centerX}" y1="${bodyBottom}" x2="${x + width - 5}" y2="${y + height - 2}" stroke="black" stroke-width="1.5"/>
  <!-- Label -->
  <text x="${centerX}" y="${y + height + 15}" text-anchor="middle" font-size="12">${this.label}</text>
</g>`
  }
}
