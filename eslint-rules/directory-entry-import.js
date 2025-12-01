import fs from "node:fs"
import path from "node:path"

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".d.ts"]
const projectRoot = path.resolve(process.cwd())
const srcRoot = path.join(projectRoot, "src")

const tsconfigPath = path.join(projectRoot, "tsconfig.json")
let baseUrl = projectRoot
let aliasConfigs = []

try {
  const tsconfigRaw = fs.readFileSync(tsconfigPath, "utf8")
  const tsconfigJson = JSON.parse(tsconfigRaw)
  const compilerOptions = tsconfigJson?.compilerOptions ?? {}
  baseUrl = path.resolve(projectRoot, compilerOptions.baseUrl ?? ".")

  const paths = compilerOptions.paths ?? {}
  aliasConfigs = Object.entries(paths)
    .map(([pattern, targets]) => {
      if (!Array.isArray(targets) || targets.length === 0) {
        return undefined
      }
      const target = targets[0]
      const placeholder = "__ALIAS_WILDCARD__"
      const escaped = pattern
        .replace(/\*/g, placeholder)
        .replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&")
        .replace(new RegExp(placeholder, "g"), "(.*)")
      const regex = new RegExp(`^${escaped}$`)
      return {
        pattern,
        regex,
        target,
      }
    })
    .filter(Boolean)
} catch {
  aliasConfigs = []
}

function resolveCandidateFile(basePath) {
  const candidatePaths = [basePath, ...EXTENSIONS.flatMap((ext) => [`${basePath}${ext}`, path.join(basePath, `index${ext}`)])]
  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.normalize(candidate)
    }
  }
  return null
}

function buildAliasAbsolutePath(sourceValue) {
  for (const alias of aliasConfigs) {
    const match = sourceValue.match(alias.regex)
    if (!match) continue
    let resolvedTarget = alias.target
    for (let i = 1; i < match.length; i++) {
      resolvedTarget = resolvedTarget.replace(/\*/, match[i] ?? "")
    }
    const candidateBase = path.resolve(baseUrl, resolvedTarget)
    return resolveCandidateFile(candidateBase)
  }
  return null
}

function resolveFile(importerDir, sourceValue) {
  if (sourceValue.startsWith(".")) {
    const candidateBase = path.resolve(importerDir, sourceValue)
    return resolveCandidateFile(candidateBase)
  }
  return buildAliasAbsolutePath(sourceValue)
}

function isAliasImport(sourceValue) {
  return aliasConfigs.some((alias) => alias.regex.test(sourceValue))
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
      if (!sourceValue.startsWith(".") && !isAliasImport(sourceValue)) return

      const targetFile = resolveFile(importerDir, sourceValue)
      if (!targetFile) return
      if (!targetFile.startsWith(srcRoot)) return

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
