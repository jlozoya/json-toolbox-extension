# JSON Toolbox

JSON Toolbox is a free and open-source Chrome extension for formatting, validating, inspecting, and transforming JSON directly from the browser.

It detects raw JSON pages, replaces them with a readable interactive tree view, and provides a full editor with formatting, minification, key sorting, JSON paths, TypeScript type generation, and local history.

## Features

- Detect raw JSON responses in the browser
- Interactive JSON tree viewer
- Expand and collapse JSON nodes
- Search keys and values inside JSON
- Copy formatted JSON from the tree view
- Raw JSON view
- Full JSON editor page
- Format JSON with configurable indentation
- Minify JSON
- Sort object keys
- Generate JSON paths
- Generate TypeScript interfaces from JSON
- Keep local formatting history
- Dark mode support based on system preference
- Context menu shortcut to open JSON Toolbox from selected text

## Project Structure

```txt
.
├── public/
│   ├── icons/
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── ErrorPanel.tsx
│   │   ├── JsonTree.tsx
│   │   ├── Tabs.tsx
│   │   └── Toolbar.tsx
│   ├── content/
│   │   └── content.ts
│   ├── editor/
│   │   ├── editor.tsx
│   │   └── EditorApp.tsx
│   ├── lib/
│   │   ├── clipboard.ts
│   │   ├── json-format.ts
│   │   ├── json-paths.ts
│   │   ├── json-stats.ts
│   │   ├── json-to-typescript.ts
│   │   └── storage.ts
│   ├── popup/
│   │   ├── popup.tsx
│   │   └── PopupApp.tsx
│   ├── background.ts
│   ├── styles.css
│   └── vite-env.d.ts
├── editor.html
├── popup.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── LICENSE
└── README.md
````

## Requirements

* Node.js 18 or newer
* npm, pnpm, yarn, or Bun
* Google Chrome or another Chromium-based browser

## Installation

Install dependencies:

```bash
npm install
```

Or with Bun:

```bash
bun install
```

## Development

Run the development build:

```bash
npm run dev
```

Or with Bun:

```bash
bun run dev
```

For Chrome extension testing, the most reliable workflow is to build the extension and load the generated `dist` folder manually.

## Build

Create a production build:

```bash
npm run build
```

Or with Bun:

```bash
bun run build
```

The compiled extension will be generated in:

```txt
dist/
```

## Load the Extension in Chrome

1. Open Chrome.
2. Go to:

```txt
chrome://extensions
```

3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `dist` folder.
6. Open a raw JSON URL or use the extension popup.

## Usage

### Raw JSON Page Viewer

When opening a raw JSON response, JSON Toolbox replaces the default browser JSON output with an interactive viewer.

Available actions:

* Search keys and values
* Expand all nodes
* Collapse all nodes
* Switch between tree and raw views
* Copy formatted JSON
* Open JSON in the full editor

### Popup

Click the extension icon to open the popup.

The popup supports:

* Format JSON
* Minify JSON
* Copy JSON
* Open the full editor

### Full Editor

The full editor supports:

* Formatting JSON
* Minifying JSON
* Sorting object keys
* Viewing JSON as a tree
* Extracting JSON paths
* Generating TypeScript types
* Saving recent JSON entries in local history

## Scripts

Common scripts:

```bash
npm run dev
npm run build
npm run preview
```

Depending on your package manager, replace `npm run` with `bun run`, `pnpm`, or `yarn`.

## Permissions

The extension uses Chrome extension APIs for:

* Opening the editor page
* Reading and writing local extension storage
* Adding a context menu entry
* Detecting JSON responses
* Injecting the JSON content viewer into raw JSON pages

Review `public/manifest.json` before publishing to confirm that every permission is required.

## Publishing Notes

Before publishing to the Chrome Web Store:

1. Run a production build.
2. Test the extension from the `dist` folder.
3. Verify that all required icons are present.
4. Confirm the manifest fields are correct.
5. Zip the contents of the `dist` folder, not the folder itself.
6. Upload the zip file to the Chrome Web Store Developer Dashboard.

## Ignored Files

Generated folders and local files should not be committed.

Recommended ignored files:

```txt
node_modules/
dist/
.env
.env.*
*.log
*.tsbuildinfo
.DS_Store
Thumbs.db
*.crx
*.pem
*.zip
```

## License

This project is open source and free to use under the MIT License.

You may use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of this software, as long as the original license notice is included.

See the [LICENSE](./LICENSE) file for details.
