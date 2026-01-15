import * as kiwi from "@lume/kiwi"
import type { FreeVariable } from "../cassowary/types"

/**
 * 型レベルでの互換性チェック
 * 
 * kiwi.Variable が FreeVariable を満たすことを保証します。
 * これがコンパイルエラーになる場合、インターフェースが一致していません。
 */
type _KiwiVariableIsCompatible = kiwi.Variable extends FreeVariable ? true : never

// ✅ この行がコンパイルエラーにならなければ、互換性があります
const _typeCheck: _KiwiVariableIsCompatible = true

// Prevent unused variable warning
export const typeCheckPassed = _typeCheck
