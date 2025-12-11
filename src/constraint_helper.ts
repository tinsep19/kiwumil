// src/constraint_helper.ts
// ConstraintHelper: IConstraintsBuilder をラップして高水準のチェーン API を提供

import type { IConstraintsBuilder, Term, ILayoutVariable } from "./core"
import type { LayoutBounds, ItemBounds } from "./core"

/**
 * ConstraintHelper は IConstraintsBuilder をラップし、
 * プラグイン／シンボル実装で使いやすい高水準のチェーン API を提供します。
 * 
 * 提供する API:
 * - setSize: Symbol の LayoutBounds のサイズを設定
 * - enclose: container と child の間の内側余白（padding）を設定
 * - arrange: 隣接要素間の隙間（margin）を設定
 * - align: 複数の変数を等しくする制約を生成
 */
export class ConstraintHelper {
  /**
   * underlying の IConstraintsBuilder への参照
   */
  readonly builder: IConstraintsBuilder

  constructor(builder: IConstraintsBuilder) {
    this.builder = builder
  }

  /**
   * Symbol の LayoutBounds のサイズを設定する
   * 
   * @param bounds - Symbol の LayoutBounds
   * @param width - 幅の値または変数
   * @param height - 高さの値または変数
   * @param strength - 制約の強度 ('weak' | 'medium' | 'strong' | 'required')
   */
  setSize(
    bounds: LayoutBounds,
    width: number | ILayoutVariable,
    height: number | ILayoutVariable,
    strength: 'weak' | 'medium' | 'strong' | 'required' = 'strong'
  ): this {
    // width 制約
    this.builder
      .expr([1, bounds.width])
      .eq([1, width])
      [strength]()

    // height 制約
    this.builder
      .expr([1, bounds.height])
      .eq([1, height])
      [strength]()

    return this
  }

  /**
   * container と child の間の内側余白（padding）を設定する
   * 
   * 以下の制約を生成:
   * - container.width >= child.width + 2*padding
   * - container.height >= child.height + 2*padding
   * - child.x >= container.x + padding
   * - child.y >= container.y + padding
   * 
   * @param container - コンテナの LayoutBounds
   * @param child - 子要素の LayoutBounds
   * @param padding - 内側余白（数値または変数）
   * @param strength - 制約の強度 ('weak' | 'medium' | 'strong' | 'required')
   */
  enclose(
    container: LayoutBounds,
    child: LayoutBounds,
    padding: number | ILayoutVariable = 0,
    strength: 'weak' | 'medium' | 'strong' | 'required' = 'required'
  ): this {
    const paddingTerm: Term = [1, padding]

    // container.width >= child.width + 2*padding
    this.builder
      .expr([1, container.width])
      .ge([1, child.width], [2, padding])
      [strength]()

    // container.height >= child.height + 2*padding
    this.builder
      .expr([1, container.height])
      .ge([1, child.height], [2, padding])
      [strength]()

    // child.x >= container.x + padding
    this.builder
      .expr([1, child.x])
      .ge([1, container.x], paddingTerm)
      [strength]()

    // child.y >= container.y + padding
    this.builder
      .expr([1, child.y])
      .ge([1, container.y], paddingTerm)
      [strength]()

    return this
  }

  /**
   * 隣接要素間の隙間（margin）を設定する
   * 
   * horizontal の場合:
   * - next.x >= prev.x + prev.width + margin
   * 
   * vertical の場合:
   * - next.y >= prev.y + prev.height + margin
   * 
   * @param direction - 配置方向 ('horizontal' | 'vertical')
   * @param prev - 前の要素の LayoutBounds または ItemBounds
   * @param next - 次の要素の LayoutBounds または ItemBounds
   * @param margin - 隙間（数値または変数）
   * @param strength - 制約の強度 ('weak' | 'medium' | 'strong' | 'required')
   */
  arrange(
    direction: 'horizontal' | 'vertical',
    prev: LayoutBounds | ItemBounds,
    next: LayoutBounds | ItemBounds,
    margin: number | ILayoutVariable = 0,
    strength: 'weak' | 'medium' | 'strong' | 'required' = 'medium'
  ): this {
    const marginTerm: Term = [1, margin]

    if (direction === 'horizontal') {
      // next.x >= prev.x + prev.width + margin
      this.builder
        .expr([1, next.x])
        .ge([1, prev.x], [1, prev.width], marginTerm)
        [strength]()
    } else {
      // next.y >= prev.y + prev.height + margin
      this.builder
        .expr([1, next.y])
        .ge([1, prev.y], [1, prev.height], marginTerm)
        [strength]()
    }

    return this
  }

  /**
   * 複数の変数を等しくする制約を生成する
   * 
   * vars[0] = vars[1], vars[1] = vars[2], ... の形で制約を生成
   * 
   * @param vars - 等しくする変数の配列
   * @param strength - 制約の強度 ('weak' | 'medium' | 'strong' | 'required')
   */
  align(
    vars: ILayoutVariable[],
    strength: 'weak' | 'medium' | 'strong' | 'required' = 'medium'
  ): this {
    if (vars.length < 2) {
      return this
    }

    for (let i = 0; i < vars.length - 1; i++) {
      this.builder
        .expr([1, vars[i]])
        .eq([1, vars[i + 1]])
        [strength]()
    }

    return this
  }
}
