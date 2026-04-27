import { fileURLToPath } from "node:url"
import { resolve, dirname } from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        editor: resolve(__dirname, "editor.html"),
        background: resolve(__dirname, "src/background.ts"),
        content: resolve(__dirname, "src/content/content.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === "background" || chunkInfo.name === "content") {
            return "[name].js"
          }
          return "assets/[name]-[hash].js"
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
})
