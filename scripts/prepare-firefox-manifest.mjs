import { spawnSync } from "node:child_process"
import { resolve } from "node:path"
import process from "node:process"

const scriptPath = resolve(process.cwd(), "scripts", "prepare-manifest.mjs")

const result = spawnSync(process.execPath, [scriptPath, "firefox"], {
  stdio: "inherit",
})

process.exit(result.status ?? 1)
