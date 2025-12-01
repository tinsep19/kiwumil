import fs from "node:fs"
import path from "node:path"

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".d.ts"]

/**
 * Attempt to resolve the imported module to a concrete file.
 * Tries the exact path, then common extensions, and finally `index` files inside directories.
 * Returns the absolute filename when found, otherwise null.
 */
function resolveImportedFile(importerDir, sourceValue) {
  const basePath = path.resolve(importerDir, sourceValue)

  const candidatePaths = [basePath]
  for (const ext of EXTENSIONS) {
    candidatePaths.push(`${basePath}${ext}`)
  }
  for (const ext of EXTENSIONS) {
    candidatePaths.push(path.join(basePath, `index${ext}`))
  }

  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate
    }
  }

  return null
}

/**
 * Returns true when the given import source is relative (starts with `.`).
 */
function isRelativeImport(value) {
  return value.startsWith(".")
}

const rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "ensure cross-directory imports go through the directory index",
      recommended: false,
    },
    schema: [],
    messages: {
      useIndex: "Import from the directory entry point (e.g. `../layout`) instead of its internal file.",
    },
  },
  create(context) {
    const filename = context.getFilename()
    if (!filename || filename === "<input>") {
      return {}
    }

    const importerDir = path.dirname(filename)

    function checkNode(node) {
      if (!node.source || typeof node.source.value !== "string") return
      const sourceValue = node.source.value
      if (!isRelativeImport(sourceValue)) return

      const targetFile = resolveImportedFile(importerDir, sourceValue)
      if (!targetFile) return

      const importerDirNormalized = path.normalize(importerDir)
      const targetDir = path.dirname(targetFile)
      if (importerDirNormalized === targetDir) return

      const baseName = path.basename(targetFile, path.extname(targetFile))
      if (baseName === "index") return

      context.report({
        node,
        messageId: "useIndex",
      })
    }

    return {
      ImportDeclaration: checkNode,
      ExportAllDeclaration: checkNode,
      ExportNamedDeclaration: checkNode,
    }
  },
}

export const rules = {
  "require-directory-index-import": rule,
}

export default { rules }
