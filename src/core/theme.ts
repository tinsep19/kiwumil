// src/core/theme.ts

// SymbolName は string 型（プラグインで拡張可能）
export type SymbolName = string

export interface StyleSet {
  textColor: string
  fontSize: number
  strokeWidth: number
  strokeColor: string
  fillColor: string
  backgroundColor?: string
}

export interface Theme {
  name: string
  defaultConfig: StyleSet
  symbols?: Record<SymbolName, Partial<StyleSet>>
}

export const defaultTheme: Theme = {
  name: 'default',
  defaultConfig: {
    textColor: 'black',
    fontSize: 12,
    strokeWidth: 2,
    strokeColor: 'black',
    fillColor: 'white',
    backgroundColor: 'white'
  },
  symbols: {
    actor: {
      strokeWidth: 2,
      strokeColor: 'black',
      textColor: 'black',
      fontSize: 12
    },
    usecase: {
      fillColor: 'white',
      strokeColor: 'black',
      strokeWidth: 2,
      textColor: 'black',
      fontSize: 12
    },
    systemBoundary: {
      fillColor: '#f8f8f8',
      strokeColor: '#999',
      strokeWidth: 2,
      textColor: 'black',
      fontSize: 14
    }
  }
}

export const blueTheme: Theme = {
  name: 'blue',
  defaultConfig: {
    textColor: '#003366',
    fontSize: 12,
    strokeWidth: 2,
    strokeColor: '#0066cc',
    fillColor: '#e6f3ff',
    backgroundColor: '#f0f8ff'
  },
  symbols: {
    actor: {
      strokeColor: '#003366',
      textColor: '#003366'
    },
    usecase: {
      fillColor: '#e6f3ff',
      strokeColor: '#0066cc',
      textColor: '#003366'
    },
    systemBoundary: {
      fillColor: '#e6f3ff',
      strokeColor: '#0066cc',
      textColor: '#003366'
    }
  }
}

export const darkTheme: Theme = {
  name: 'dark',
  defaultConfig: {
    textColor: '#d4d4d4',
    fontSize: 12,
    strokeWidth: 2,
    strokeColor: '#569cd6',
    fillColor: '#2d2d2d',
    backgroundColor: '#1e1e1e'
  },
  symbols: {
    actor: {
      strokeColor: '#4ec9b0',
      textColor: '#d4d4d4'
    },
    usecase: {
      fillColor: '#2d2d2d',
      strokeColor: '#569cd6',
      textColor: '#d4d4d4'
    },
    systemBoundary: {
      fillColor: '#2d2d2d',
      strokeColor: '#808080',
      textColor: '#d4d4d4'
    }
  }
}

export const themes = {
  default: defaultTheme,
  blue: blueTheme,
  dark: darkTheme
}

export type ThemeName = keyof typeof themes

// ヘルパー関数: シンボル用のスタイルを取得
export function getStyleForSymbol(theme: Theme, symbolName: SymbolName): StyleSet {
  const symbolStyle = theme.symbols?.[symbolName] || {}
  return {
    textColor: symbolStyle.textColor ?? theme.defaultConfig.textColor,
    fontSize: symbolStyle.fontSize ?? theme.defaultConfig.fontSize,
    strokeWidth: symbolStyle.strokeWidth ?? theme.defaultConfig.strokeWidth,
    strokeColor: symbolStyle.strokeColor ?? theme.defaultConfig.strokeColor,
    fillColor: symbolStyle.fillColor ?? theme.defaultConfig.fillColor,
    backgroundColor: symbolStyle.backgroundColor ?? theme.defaultConfig.backgroundColor
  }
}
