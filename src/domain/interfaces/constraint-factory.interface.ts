import type { 
  LayoutConstraint, 
  GeometricConstraint, 
  LayoutHint, 
  SymbolInternalConstraint 
} from "../entities/layout-constraint"
import type { ConstraintSpec } from "../../core/solver"

/**
 * IConstraintFactory: 制約を生成するファクトリ
 * 
 * Infrastructure 層の ICassowarySolver から LinearConstraint を取得し、
 * Domain 層の LayoutConstraint（id + category 付き）に変換します。
 */
export interface IConstraintFactory {
  /**
   * 幾何的制約を生成
   * 
   * 常に required 強度で、幾何的に必ず満たす必要がある制約。
   * 例: right = x + width, bottom = y + height
   * 
   * @param id 制約ID
   * @param spec 制約仕様
   * @param description 説明（オプション）
   * @returns GeometricConstraint
   */
  createGeometric(
    id: string, 
    spec: ConstraintSpec, 
    description?: string
  ): GeometricConstraint

  /**
   * レイアウトヒントを生成
   * 
   * ユーザーが指定するレイアウトヒント。強度は strong/medium/weak。
   * 例: arrangeHorizontal, alignLeft, z のデフォルト値
   * 
   * @param id 制約ID
   * @param spec 制約仕様
   * @param strength 強度（strong/medium/weak）
   * @param hintType ヒントの種類
   * @param description 説明（オプション）
   * @returns LayoutHint
   */
  createHint(
    id: string,
    spec: ConstraintSpec,
    strength: "strong" | "medium" | "weak",
    hintType: "arrange" | "align" | "enclose" | "custom",
    description?: string
  ): LayoutHint

  /**
   * Symbol 内部制約を生成
   * 
   * Symbol 内部のレイアウト制約。強度は strong/medium/weak。
   * 例: Actor の頭と体の位置関係
   * 
   * @param id 制約ID
   * @param symbolId Symbol ID
   * @param spec 制約仕様
   * @param strength 強度（strong/medium/weak）
   * @param description 説明（オプション）
   * @returns SymbolInternalConstraint
   */
  createSymbolInternal(
    id: string,
    symbolId: string,
    spec: ConstraintSpec,
    strength: "strong" | "medium" | "weak",
    description?: string
  ): SymbolInternalConstraint
}
