import type { 
  Variable, 
  AnchorX, 
  AnchorY, 
  AnchorZ, 
  Width, 
  Height,
  GenericVariable,
  VariableType
} from "../entities"

/**
 * IVariableFactory: 変数を生成するファクトリ
 * 
 * Infrastructure 層の ICassowarySolver から FreeVariable を取得し、
 * Domain 層の Variable（id + variableType 付き）に変換します。
 */
export interface IVariableFactory {
  /**
   * 汎用変数を生成
   * @param id 変数ID
   * @returns GenericVariable
   */
  create(id: string): GenericVariable

  /**
   * 型付き変数を生成
   * @param id 変数ID
   * @param variableType 変数の種類
   * @returns Variable
   */
  createTyped(id: string, variableType: VariableType): Variable

  /**
   * AnchorX を生成
   * @param id 変数ID
   * @returns AnchorX
   */
  createAnchorX(id: string): AnchorX

  /**
   * AnchorY を生成
   * @param id 変数ID
   * @returns AnchorY
   */
  createAnchorY(id: string): AnchorY

  /**
   * AnchorZ を生成
   * @param id 変数ID
   * @returns AnchorZ
   */
  createAnchorZ(id: string): AnchorZ

  /**
   * Width を生成
   * @param id 変数ID
   * @returns Width
   */
  createWidth(id: string): Width

  /**
   * Height を生成
   * @param id 変数ID
   * @returns Height
   */
  createHeight(id: string): Height
}
