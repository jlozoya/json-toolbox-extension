import { access, copyFile } from "node:fs/promises"
import { constants } from "node:fs"
import { resolve } from "node:path"

const distDirectory = resolve("dist")
const distManifestPath = resolve(distDirectory, "manifest.json")
const firefoxManifestPath = resolve("public", "manifest.firefox.json")

try {
  await access(distDirectory, constants.F_OK)
} catch {
  throw new Error("dist folder not found. Run bun run build before preparing Firefox.")
}

await copyFile(firefoxManifestPath, distManifestPath)

console.log("Firefox manifest copied to dist/manifest.json")
