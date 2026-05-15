import archiver from "archiver"
import fs from "node:fs"
import path from "node:path"
import process from "node:process"

const target = process.argv[2] ?? "chrome"

if (target !== "chrome" && target !== "firefox") {
  throw new Error(`Invalid target "${target}". Use "chrome" or "firefox".`)
}

const rootDir = process.cwd()
const distDir = path.join(rootDir, "dist", target)
const outputDir = path.join(rootDir, "release")
const packageJsonPath = path.join(rootDir, "package.json")
const manifestPath = path.join(distDir, "manifest.json")

if (!fs.existsSync(packageJsonPath)) {
  throw new Error("package.json not found")
}

if (!fs.existsSync(distDir)) {
  throw new Error(`dist/${target} folder not found. Run npm run build:${target} first.`)
}

if (!fs.existsSync(manifestPath)) {
  throw new Error(
    `dist/${target}/manifest.json not found. Run npm run build:${target} first.`,
  )
}

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
const packageName = packageJson.name ?? "browser-extension"
const packageVersion = packageJson.version ?? "0.0.0"

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"))

manifest.version = packageVersion

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

fs.mkdirSync(outputDir, { recursive: true })

const zipName = `${packageName}-${target}-${packageVersion}.zip`
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
  console.log(`Packed dist/${target}`)
  console.log(`Created ${path.relative(rootDir, zipPath)}`)
  console.log(`Size: ${(archive.pointer() / 1024).toFixed(1)} KB`)
})

archive.on("error", (error) => {
  throw error
})

archive.pipe(output)
archive.directory(distDir, false)
await archive.finalize()
