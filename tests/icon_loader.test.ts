import { describe, test, expect } from "bun:test"
import { IconLoader, parse } from "../src/icon/icon_loader"
import * as fs from "fs"
import * as path from "path"

describe("parse function", () => {
  test("should extract all required properties from valid SVG", () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="30"/>
    </svg>`

    const result = parse(svgContent, "test-icon")

    expect(result.width).toBe(64)
    expect(result.height).toBe(64)
    expect(result.viewBox).toBe("0 0 64 64")
    expect(result.href).toBe("test-icon")
    expect(result.raw).toBe(svgContent)
  })

  test("should extract width and height from viewBox when attributes are missing", () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">
      <rect width="100" height="50"/>
    </svg>`

    const result = parse(svgContent, "test-icon")

    expect(result.width).toBe(100)
    expect(result.height).toBe(50)
    expect(result.viewBox).toBe("0 0 100 50")
  })

  test("should prefer width attribute over viewBox", () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60" viewBox="0 0 100 50">
      <rect width="100" height="50"/>
    </svg>`

    const result = parse(svgContent, "test-icon")

    expect(result.width).toBe(80)
    expect(result.height).toBe(60)
  })

  test("should handle decimal dimensions", () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="64.5" height="48.75" viewBox="0 0 64.5 48.75">
      <circle cx="32" cy="24" r="20"/>
    </svg>`

    const result = parse(svgContent, "test-icon")

    expect(result.width).toBe(64.5)
    expect(result.height).toBe(48.75)
  })

  test("should throw error when viewBox is missing", () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
      <circle cx="32" cy="32" r="30"/>
    </svg>`

    expect(() => parse(svgContent, "test-icon")).toThrow(
      "Failed to extract viewBox from SVG content"
    )
  })

  test("should throw error when width cannot be extracted", () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0">
      <circle cx="32" cy="32" r="30"/>
    </svg>`

    expect(() => parse(svgContent, "test-icon")).toThrow("Failed to extract width from SVG content")
  })

  test("should throw error when height cannot be extracted", () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="invalid viewbox format">
      <circle cx="32" cy="32" r="30"/>
    </svg>`

    expect(() => parse(svgContent, "test-icon")).toThrow("Failed to extract")
  })

  test("should handle viewBox with extra whitespace", () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48" viewBox="  0   0   64   48  ">
      <circle cx="32" cy="24" r="20"/>
    </svg>`

    const result = parse(svgContent, "test-icon")

    expect(result.width).toBe(64)
    expect(result.height).toBe(48)
    expect(result.viewBox).toBe("  0   0   64   48  ")
  })

  test("should handle single quotes in SVG attributes", () => {
    const svgContent = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
      <circle cx='32' cy='32' r='30'/>
    </svg>`

    const result = parse(svgContent, "test-icon")

    expect(result.width).toBe(64)
    expect(result.height).toBe(64)
    expect(result.viewBox).toBe("0 0 64 64")
  })
})

describe("IconLoader", () => {
  describe("load_sync with real SVG file", () => {
    test("should load actor.svg successfully", () => {
      const actorPath = path.join(__dirname, "../src/plugin/uml/icons/actor.svg")

      // Verify the file exists
      expect(fs.existsSync(actorPath)).toBe(true)

      const baseUrl = path.join(__dirname, "../src/plugin/uml")
      const loader = new IconLoader("uml", "actor", baseUrl, "icons/actor.svg")

      const result = loader.load_sync()

      expect(result.width).toBe(64)
      expect(result.height).toBe(64)
      expect(result.viewBox).toBe("0 0 64 64")
      expect(result.href).toBe("uml-actor")
      expect(result.raw).toContain("<svg")
      expect(result.raw).toContain('viewBox="0 0 64 64"')
    })

    test("should throw error for non-existent file", () => {
      const loader = new IconLoader("test", "nonexistent", import.meta.url, "icons/nonexistent.svg")

      expect(() => loader.load_sync()).toThrow("Icon file not found")
    })
  })

  describe("load_sync with import.meta.url", () => {
    test("should load actor.svg using file:// URL", () => {
      // Need to use proper file:// URL format with correct base path
      const baseUrlPath = path.join(__dirname, "../src/plugin/uml/")
      const baseUrl = `file://${baseUrlPath}`
      const loader = new IconLoader("uml", "actor", baseUrl, "icons/actor.svg")

      const result = loader.load_sync()

      expect(result.width).toBe(64)
      expect(result.height).toBe(64)
      expect(result.href).toBe("uml-actor")
    })
  })

  describe("load_sync error handling", () => {
    test("should provide descriptive error for missing file", () => {
      const loader = new IconLoader("test", "missing", "/nonexistent/path", "icons/missing.svg")

      expect(() => loader.load_sync()).toThrow(/Icon file not found.*icons\/missing\.svg/)
    })

    test("should handle parsing errors gracefully", () => {
      // Create a temporary invalid SVG file
      const tmpDir = "/tmp/icon-loader-test"
      const tmpFile = path.join(tmpDir, "invalid.svg")

      fs.mkdirSync(tmpDir, { recursive: true })
      fs.writeFileSync(tmpFile, "<svg>no viewBox</svg>")

      const loader = new IconLoader("test", "invalid", tmpDir, "invalid.svg")

      expect(() => loader.load_sync()).toThrow(/Failed to load icon.*Failed to extract viewBox/)

      // Cleanup
      fs.unlinkSync(tmpFile)
      fs.rmdirSync(tmpDir)
    })
  })
})
