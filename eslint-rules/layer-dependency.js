// eslint-rules/layer-dependency.js
// 循環依存防止のためのレイヤーベースESLintルール

import path from "node:path"

// アーキテクチャレイヤーの定義
const LAYERS = {
  core: 1,
  layout: 1, 
  theme: 1,
  icon: 1,
  utils: 1,
  model: 2,
  hint: 2,
  plugin: 3,
  render: 3,
  dsl: 4,
}

// 許可された依存関係マップ
const ALLOWED_DEPENDENCIES = {
  core: [],
  layout: ["core"],
  theme: ["core"],
  icon: ["core"],
  utils: ["core"],
  model: ["core", "theme", "icon", "utils"],
  hint: ["core", "model"],
  plugin: ["core", "theme", "icon", "utils", "model", "hint"],
  render: ["core", "theme", "icon", "utils", "model", "plugin"],
  dsl: ["core", "layout", "theme", "icon", "utils", "model", "hint", "plugin", "render"]
}

/**
 * ファイルパスからレイヤー名を取得
 */
function getLayerFromPath(filePath) {
  const segments = filePath.split(path.sep)
  const srcIndex = segments.findIndex(segment => segment === 'src')
  
  if (srcIndex === -1 || srcIndex + 1 >= segments.length) {
    return null
  }
  
  return segments[srcIndex + 1]
}

/**
 * レイヤー依存関係を検証
 */
function validateLayerDependency(importerPath, importPath) {
  const importerLayer = getLayerFromPath(importerPath)
  const importeeLayer = getLayerFromPath(importPath)
  
  if (!importerLayer || !importeeLayer) {
    return true // src外のファイルは検証対象外
  }
  
  if (importerLayer === importeeLayer) {
    return true // 同じレイヤー内は許可
  }
  
  const allowedDeps = ALLOWED_DEPENDENCIES[importerLayer] || []
  return allowedDeps.includes(importeeLayer)
}

/**
 * インポートパスを解決（相対パスを絶対パスに変換）
 */
function resolveImportPath(currentFilePath, importPath) {
  if (importPath.startsWith('.')) {
    const currentDir = path.dirname(currentFilePath)
    return path.resolve(currentDir, importPath)
  }
  return null // エイリアスインポートは対象外
}

const layerDependencyRule = {
  meta: {
    type: "problem",
    docs: {
      description: "enforce proper layer dependencies to prevent circular references",
      category: "Architecture",
      recommended: true,
    },
    schema: [],
    messages: {
      invalidLayerDependency: "Layer '{{importerLayer}}' cannot depend on layer '{{importeeLayer}}'. Allowed dependencies: {{allowedDeps}}",
      circularReferenceRisk: "This import may create a circular dependency between {{importerLayer}} and {{importeeLayer}} layers"
    },
  },
  
  create(context) {
    const filename = context.getFilename()
    
    if (!filename || filename === "<input>") {
      return {}
    }

    function checkImport(node) {
      if (!node.source || typeof node.source.value !== "string") return

      const importPath = node.source.value
      const resolvedPath = resolveImportPath(filename, importPath)
      
      if (!resolvedPath) return // エイリアスインポートはスキップ
      
      const importerLayer = getLayerFromPath(filename)
      const importeeLayer = getLayerFromPath(resolvedPath)
      
      if (!importerLayer || !importeeLayer) return
      
      if (!validateLayerDependency(filename, resolvedPath)) {
        const allowedDeps = ALLOWED_DEPENDENCIES[importerLayer] || []
        
        context.report({
          node,
          messageId: "invalidLayerDependency",
          data: {
            importerLayer,
            importeeLayer,
            allowedDeps: allowedDeps.join(", ") || "none"
          }
        })
      }
    }

    return {
      ImportDeclaration: checkImport,
      ExportNamedDeclaration: checkImport,
      ExportAllDeclaration: checkImport,
    }
  },
}

export const rules = {
  "no-layer-violation": layerDependencyRule,
}

export default { rules }