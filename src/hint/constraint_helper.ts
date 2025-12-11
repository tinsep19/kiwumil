// src/hint/constraint_helper.ts
// ConstraintHelper: IConstraintsBuilder をラップして高水準のチェーン API を提供

import type { IConstraintsBuilder, ILayoutVariable, LayoutBounds, ItemBounds } from "../core"
import type { StrengthBuilder } from "./strength_builder"
import { SetSizeBuilder } from "./set_size_builder"
import { EncloseBuilder } from "./enclose_builder"
import { ArrangeBuilder } from "./arrange_builder"
import { AlignBuilder } from "./align_builder"

/**
 * ConstraintHelper は IConstraintsBuilder をラップし、
 * プラグイン／シンボル実装で使いやすい高水準のチェーン API を提供します。
 * 
 * 提供する API:
 * - setSize: Symbol の LayoutBounds のサイズを設定
 * - enclose: container と children の間の内側余白（padding）を設定
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
   * @returns 制約の強度を設定するビルダー
   * 
   * @example
   * helper.setSize(container, 200, 150).strong()
   */
  setSize(
    bounds: LayoutBounds,
    width: number | ILayoutVariable,
    height: number | ILayoutVariable
  ): StrengthBuilder {
    return new SetSizeBuilder(this.builder, bounds, width, height)
  }

  /**
   * container と children の間の内側余白（padding）を設定する
   * 
   * 以下の制約を生成:
   * - container.width >= child.width + 2*padding
   * - container.height >= child.height + 2*padding
   * - child.x >= container.x + padding
   * - child.y >= container.y + padding
   * 
   * @param container - コンテナの LayoutBounds
   * @returns childs と padding と制約の強度を設定するビルダー
   * 
   * @example
   * helper.enclose(container).childs(child1, child2).padding(10).strong()
   */
  enclose(container: LayoutBounds): EncloseBuilder {
    return new EncloseBuilder(this.builder, container)
  }

  /**
   * 複数要素間の隙間（margin）と配置方向を設定する
   * 
   * 水平配置の制約を生成:
   * - x1.right + margin = x2.left (x2.x >= x1.x + x1.width + margin)
   * - x2.right + margin = x3.left (x3.x >= x2.x + x2.width + margin)
   * 
   * 垂直配置の制約を生成:
   * - x1.bottom + margin = x2.top (x2.y >= x1.y + x1.height + margin)
   * - x2.bottom + margin = x3.top (x3.y >= x2.y + x2.height + margin)
   * 
   * @param elements - 配置する要素の LayoutBounds または ItemBounds（可変長引数）
   * @returns margin と方向と制約の強度を設定するビルダー
   * 
   * @example
   * helper.arrange(x1, x2, x3).margin(20).horizontal().medium()
   * helper.arrange(x1, x2, x3).margin(20).vertical().medium()
   */
  arrange(...elements: (LayoutBounds | ItemBounds)[]): ArrangeBuilder {
    return new ArrangeBuilder(this.builder, elements)
  }

  /**
   * 複数の変数を等しくする制約を生成する
   * 
   * vars[0] = vars[1], vars[1] = vars[2], ... の形で制約を生成
   * 
   * @param vars - 等しくする変数（可変長引数）
   * @returns 制約の強度を設定するビルダー
   * 
   * @example
   * helper.align(layout.z, container.z, item1.z, item2.z).required()
   */
  align(...vars: ILayoutVariable[]): StrengthBuilder {
    return new AlignBuilder(this.builder, vars)
  }
}
