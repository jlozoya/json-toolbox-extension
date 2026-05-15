import { constants } from "node:fs"
import { access, copyFile, readFile, rm, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

const target = process.argv[2] ?? "chrome"

if (target !== "chrome" && target !== "firefox") {
  throw new Error(`Invalid target "${target}". Use "chrome" or "firefox".`)
}

const rootDirectory = process.cwd()
const distDirectory = resolve(rootDirectory, "dist", target)
const packageJsonPath = resolve(rootDirectory, "package.json")
const sourceManifestPath = resolve(
  rootDirectory,
  "public",
  target === "firefox" ? "manifest.firefox.json" : "manifest.chrome.json",
)
const distManifestPath = resolve(distDirectory, "manifest.json")
const distChromeManifestPath = resolve(distDirectory, "manifest.chrome.json")
const distFirefoxManifestPath = resolve(distDirectory, "manifest.firefox.json")

async function assertExists(path, message) {
  try {
    await access(path, constants.F_OK)
  } catch {
    throw new Error(message)
  }
}

await assertExists(
  distDirectory,
  `dist/${target} folder not found. Run the Vite ${target} build before preparing the manifest.`,
)

await assertExists(
  sourceManifestPath,
  `Missing ${target} manifest at ${sourceManifestPath}.`,
)

await assertExists(packageJsonPath, "package.json not found.")

await copyFile(sourceManifestPath, distManifestPath)

const [packageJsonText, manifestText] = await Promise.all([
  readFile(packageJsonPath, "utf8"),
  readFile(distManifestPath, "utf8"),
])

const packageJson = JSON.parse(packageJsonText)
const manifest = JSON.parse(manifestText)

if (typeof packageJson.version === "string" && packageJson.version.trim()) {
  manifest.version = packageJson.version
}

await writeFile(distManifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

await Promise.allSettled([
  rm(distChromeManifestPath, { force: true }),
  rm(distFirefoxManifestPath, { force: true }),
])

console.log(`Prepared ${target} manifest at dist/${target}/manifest.json`)
