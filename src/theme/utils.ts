// src/theme/utils.ts

import { StyleSet, Theme, SymbolName } from './types'

// ヘルパー関数: シンボル用のスタイルを取得
export function getStyleForSymbol(theme: Theme, symbolName: SymbolName): StyleSet {
  const symbolStyle = theme.symbols?.[symbolName] || {}
  return {
    textColor: symbolStyle.textColor ?? theme.defaultStyleSet.textColor,
    fontSize: symbolStyle.fontSize ?? theme.defaultStyleSet.fontSize,
    fontFamily: symbolStyle.fontFamily ?? theme.defaultStyleSet.fontFamily,
    strokeWidth: symbolStyle.strokeWidth ?? theme.defaultStyleSet.strokeWidth,
    strokeColor: symbolStyle.strokeColor ?? theme.defaultStyleSet.strokeColor,
    fillColor: symbolStyle.fillColor ?? theme.defaultStyleSet.fillColor,
    backgroundColor: symbolStyle.backgroundColor ?? theme.defaultStyleSet.backgroundColor,
    horizontalGap: symbolStyle.horizontalGap ?? theme.defaultStyleSet.horizontalGap,
    verticalGap: symbolStyle.verticalGap ?? theme.defaultStyleSet.verticalGap
  }
}
