// src/core/theme.ts

// SymbolName は string 型（プラグインで拡張可能）
export type SymbolName = string

export interface StyleSet {
  textColor: string
  fontSize: number
  fontFamily: string
  strokeWidth: number
  strokeColor: string
  fillColor: string
  backgroundColor?: string
  horizontalGap: number
  verticalGap: number
}

export interface Theme {
  name: string
  defaultStyleSet: StyleSet
  symbols?: Record<SymbolName, Partial<StyleSet>>
}

// Default Theme
export const DefaultTheme: Theme = {
  name: 'default',
  defaultStyleSet: {
    textColor: 'black',
    fontSize: 12,
    fontFamily: 'Arial',
    strokeWidth: 2,
    strokeColor: 'black',
    fillColor: 'white',
    backgroundColor: 'white',
    horizontalGap: 80,
    verticalGap: 50
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
    },
    // Basic shapes
    circle: {
      fillColor: 'white',
      strokeColor: 'black',
      strokeWidth: 2,
      textColor: 'black',
      fontSize: 12
    },
    ellipse: {
      fillColor: 'white',
      strokeColor: 'black',
      strokeWidth: 2,
      textColor: 'black',
      fontSize: 12
    },
    rectangle: {
      fillColor: 'white',
      strokeColor: 'black',
      strokeWidth: 2,
      textColor: 'black',
      fontSize: 12
    },
    roundedRectangle: {
      fillColor: 'white',
      strokeColor: 'black',
      strokeWidth: 2,
      textColor: 'black',
      fontSize: 12
    },
    text: {
      textColor: 'black',
      fontSize: 14,
      fontFamily: 'Arial'
    }
  }
}

// Blue Theme
export const BlueTheme: Theme = {
  name: 'blue',
  defaultStyleSet: {
    textColor: '#003366',
    fontSize: 12,
    fontFamily: 'Arial',
    strokeWidth: 2,
    strokeColor: '#0066cc',
    fillColor: '#e6f3ff',
    backgroundColor: '#f0f8ff',
    horizontalGap: 80,
    verticalGap: 50
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
    },
    // Basic shapes
    circle: {
      fillColor: '#e6f3ff',
      strokeColor: '#0066cc',
      textColor: '#003366'
    },
    ellipse: {
      fillColor: '#e6f3ff',
      strokeColor: '#0066cc',
      textColor: '#003366'
    },
    rectangle: {
      fillColor: '#e6f3ff',
      strokeColor: '#0066cc',
      textColor: '#003366'
    },
    roundedRectangle: {
      fillColor: '#e6f3ff',
      strokeColor: '#0066cc',
      textColor: '#003366'
    },
    text: {
      textColor: '#003366',
      fontSize: 14,
      fontFamily: 'Arial'
    }
  }
}

// Dark Theme
export const DarkTheme: Theme = {
  name: 'dark',
  defaultStyleSet: {
    textColor: '#d4d4d4',
    fontSize: 12,
    fontFamily: 'Arial',
    strokeWidth: 2,
    strokeColor: '#569cd6',
    fillColor: '#2d2d2d',
    backgroundColor: '#1e1e1e',
    horizontalGap: 80,
    verticalGap: 50
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
    },
    // Basic shapes
    circle: {
      fillColor: '#2d2d2d',
      strokeColor: '#569cd6',
      textColor: '#d4d4d4'
    },
    ellipse: {
      fillColor: '#2d2d2d',
      strokeColor: '#569cd6',
      textColor: '#d4d4d4'
    },
    rectangle: {
      fillColor: '#2d2d2d',
      strokeColor: '#569cd6',
      textColor: '#d4d4d4'
    },
    roundedRectangle: {
      fillColor: '#2d2d2d',
      strokeColor: '#569cd6',
      textColor: '#d4d4d4'
    },
    text: {
      textColor: '#d4d4d4',
      fontSize: 14,
      fontFamily: 'Arial'
    }
  }
}

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
