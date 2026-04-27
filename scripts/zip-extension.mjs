import archiver from "archiver"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const rootDir = process.cwd()
const distDir = path.join(rootDir, "dist")
const outputDir = path.join(rootDir, "release")
const packageJsonPath = path.join(rootDir, "package.json")
const manifestPath = path.join(distDir, "manifest.json")

if (!fs.existsSync(packageJsonPath)) {
  throw new Error("package.json not found")
}

if (!fs.existsSync(distDir)) {
  throw new Error("dist folder not found. Run bun run build first.")
}

if (!fs.existsSync(manifestPath)) {
  throw new Error("dist/manifest.json not found. Run bun run build first.")
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
const packageName = packageJson.name ?? "chrome-extension"
const packageVersion = packageJson.version ?? "0.0.0"

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))

manifest.version = packageVersion

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

fs.mkdirSync(outputDir, { recursive: true })

const zipName = `${packageName}-${packageVersion}.zip`
const zipPath = path.join(outputDir, zipName)

if (fs.existsSync(zipPath)) {
  fs.rmSync(zipPath)
}

const output = fs.createWriteStream(zipPath)
const archive = archiver("zip", {
  zlib: {
    level: 9,
  },
})

output.on("close", () => {
  console.log(`Updated dist/manifest.json version to ${packageVersion}`)
  console.log(`Created ${path.relative(rootDir, zipPath)}`)
  console.log(`Size: ${(archive.pointer() / 1024).toFixed(1)} KB`)
})

archive.on("error", (error) => {
  throw error
})

archive.pipe(output)
archive.directory(distDir, false)
await archive.finalize()