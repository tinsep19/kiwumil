// src/core/theme.ts

export interface ThemeColors {
  background: string
  usecaseFill: string
  usecaseStroke: string
  actorStroke: string
  relationshipStroke: string
  text: string
}

export interface Theme {
  name: string
  colors: ThemeColors
  strokeWidth: {
    usecase: number
    actor: number
    relationship: number
  }
  fontSize: {
    usecase: number
    actor: number
  }
}

export const defaultTheme: Theme = {
  name: 'default',
  colors: {
    background: 'white',
    usecaseFill: 'white',
    usecaseStroke: 'black',
    actorStroke: 'black',
    relationshipStroke: 'black',
    text: 'black'
  },
  strokeWidth: {
    usecase: 2,
    actor: 2,
    relationship: 1.5
  },
  fontSize: {
    usecase: 12,
    actor: 12
  }
}

export const blueTheme: Theme = {
  name: 'blue',
  colors: {
    background: '#f0f8ff',
    usecaseFill: '#e6f3ff',
    usecaseStroke: '#0066cc',
    actorStroke: '#003366',
    relationshipStroke: '#0066cc',
    text: '#003366'
  },
  strokeWidth: {
    usecase: 2,
    actor: 2,
    relationship: 1.5
  },
  fontSize: {
    usecase: 12,
    actor: 12
  }
}

export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    background: '#1e1e1e',
    usecaseFill: '#2d2d2d',
    usecaseStroke: '#569cd6',
    actorStroke: '#4ec9b0',
    relationshipStroke: '#808080',
    text: '#d4d4d4'
  },
  strokeWidth: {
    usecase: 2,
    actor: 2,
    relationship: 1.5
  },
  fontSize: {
    usecase: 12,
    actor: 12
  }
}

export const themes = {
  default: defaultTheme,
  blue: blueTheme,
  dark: darkTheme
}

export type ThemeName = keyof typeof themes
