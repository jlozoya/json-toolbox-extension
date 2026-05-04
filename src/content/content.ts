;(() => {
  const marker = "__JSON_TOOLBOX_CONTENT_SCRIPT_LOADED__"

  if ((globalThis as Record<string, unknown>)[marker]) {
    return
  }

  ;(globalThis as Record<string, unknown>)[marker] = true

  const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }

  #jtb-root {
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #f5f7fb;
    color: #111827;
    min-height: 100vh;
    margin: 0;
    overflow-x: hidden;
  }

  #jtb-header {
    background: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    padding: 10px 20px;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  #jtb-title {
    font-weight: 750;
    font-size: 15px;
    color: #111827;
    white-space: nowrap;
  }

  #jtb-actions {
    display: flex;
    gap: 6px;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .jtb-search {
    border: 1px solid #d1d5db;
    background: #f9fafb;
    color: #111827;
    border-radius: 8px;
    padding: 5px 10px;
    font-size: 12px;
    outline: none;
    width: 200px;
    min-width: 160px;
  }

  .jtb-search:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgb(37 99 235 / 14%);
  }

  .jtb-search::placeholder { color: #9ca3af; }

  .jtb-btn {
    border: 1px solid #d1d5db;
    background: #ffffff;
    color: #111827;
    border-radius: 8px;
    padding: 5px 10px;
    font-size: 12px;
    font-weight: 650;
    cursor: pointer;
    white-space: nowrap;
    font-family: inherit;
    flex: 0 0 auto;
  }

  .jtb-btn:hover { background: #f9fafb; }

  .jtb-btn-primary {
    background: #2563eb;
    border-color: #2563eb;
    color: white;
  }

  .jtb-btn-primary:hover { background: #1d4ed8; }

  #jtb-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px 20px;
    border-bottom: 1px solid #e5e7eb;
    background: #ffffff;
  }

  .jtb-stat {
    border: 1px solid #e5e7eb;
    background: #f5f7fb;
    border-radius: 999px;
    padding: 2px 8px;
    color: #4b5563;
    font-size: 11px;
    font-weight: 650;
  }

  #jtb-tree {
    padding: 16px 20px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 13px;
    line-height: 1.65;
    overflow-x: auto;
    max-width: 100vw;
  }

  .jtb-node {
    margin-left: 18px;
  }

  .jtb-row-tooltip {
    position: relative;
    width: max-content;
    min-width: 100%;
  }

  .jtb-row {
    display: flex;
    align-items: baseline;
    gap: 5px;
    padding: 1px 4px;
    border-radius: 4px;
    cursor: default;
    min-height: 22px;
    width: max-content;
    min-width: 100%;
  }

  .jtb-row:hover { background: rgb(37 99 235 / 6%); }

  .jtb-copy-ignore,
  .jtb-toggle,
  .jtb-toggle-gap,
  .jtb-count,
  .jtb-tooltip {
    user-select: none;
  }

  .jtb-tooltip {
    position: absolute;
    left: 4px;
    bottom: calc(100% + 8px);
    z-index: 200;
    max-width: min(420px, calc(100vw - 64px));
    padding: 6px 8px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #111827;
    color: #ffffff;
    box-shadow: 0 8px 24px rgb(15 23 42 / 20%);
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 12px;
    line-height: 1.35;
    white-space: normal;
    overflow-wrap: anywhere;
    pointer-events: none;
    opacity: 0;
    transform: translateY(4px);
    transition:
      opacity 0.16s ease,
      transform 0.16s ease;
  }

  .jtb-row-tooltip:hover .jtb-tooltip,
  .jtb-row-tooltip:focus-within .jtb-tooltip {
    opacity: 1;
    transform: translateY(0);
  }

  .jtb-toggle {
    border: 0;
    background: transparent;
    color: #2563eb;
    font-size: 10px;
    cursor: pointer;
    padding: 0;
    width: 14px;
    text-align: center;
    flex-shrink: 0;
    font-family: inherit;
    line-height: 1;
  }

  .jtb-toggle-gap {
    width: 14px;
    flex-shrink: 0;
    display: inline-block;
  }

  .jtb-key {
    color: #7c3aed;
    font-weight: 700;
    flex-shrink: 0;
  }

  .jtb-bracket {
    color: #374151;
    flex-shrink: 0;
  }

  .jtb-count {
    color: #9ca3af;
    font-size: 11px;
    flex-shrink: 0;
  }

  .jtb-null { color: #6b7280; }
  .jtb-string { color: #047857; }
  .jtb-number { color: #b45309; }
  .jtb-boolean { color: #be123c; }
  .jtb-comma { color: #374151; flex-shrink: 0; }

  .jtb-string,
  .jtb-number,
  .jtb-boolean,
  .jtb-null {
    overflow-wrap: anywhere;
  }

  .jtb-match {
    background: #fef08a;
    border-radius: 2px;
  }

  .jtb-hidden { display: none !important; }

  .jtb-no-results {
    color: #6b7280;
    font-family: ui-sans-serif, system-ui, sans-serif;
    padding: 24px;
    font-size: 13px;
  }

  #jtb-raw {
    padding: 16px 20px;
    overflow-x: auto;
    max-width: 100vw;
  }

  #jtb-raw-pre {
    margin: 0;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 13px;
    line-height: 1.65;
    color: #111827;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .jtb-btn-active {
    background: #eff6ff;
    border-color: #2563eb;
    color: #2563eb;
  }

  @media (max-width: 760px) {
    #jtb-header {
      grid-template-columns: minmax(0, 1fr);
      align-items: stretch;
      padding: 10px 12px;
    }

    #jtb-title {
      font-size: 14px;
    }

    #jtb-actions {
      justify-content: flex-start;
      width: 100%;
      padding-bottom: 2px;
    }

    .jtb-search {
      width: 180px;
      min-width: 180px;
    }

    #jtb-stats {
      padding: 8px 12px;
    }

    #jtb-tree,
    #jtb-raw {
      padding: 12px;
    }

    #jtb-tree,
    #jtb-raw-pre {
      font-size: 12px;
      line-height: 1.6;
    }

    .jtb-node {
      margin-left: 14px;
    }
  }

  @media (max-width: 480px) {
    #jtb-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      overflow-x: visible;
    }

    .jtb-search {
      grid-column: 1 / -1;
      width: 100%;
      min-width: 0;
    }

    .jtb-btn {
      width: 100%;
      padding: 7px 8px;
      text-align: center;
    }

    #jtb-stats {
      gap: 5px;
    }

    .jtb-stat {
      font-size: 10px;
      padding: 2px 7px;
    }

    .jtb-node {
      margin-left: 10px;
    }

    .jtb-row {
      gap: 4px;
      padding-inline: 2px;
    }
  }

  @media (prefers-color-scheme: dark) {
    #jtb-root {
      background: #0f172a;
      color: #e5e7eb;
    }

    #jtb-header,
    #jtb-stats {
      background: #111827;
      border-color: #1f2937;
    }

    #jtb-title { color: #f9fafb; }

    .jtb-search {
      background: #1f2937;
      border-color: #374151;
      color: #e5e7eb;
    }

    .jtb-btn {
      background: #1f2937;
      border-color: #374151;
      color: #e5e7eb;
    }

    .jtb-btn:hover { background: #374151; }

    .jtb-stat {
      background: #1f2937;
      border-color: #374151;
      color: #9ca3af;
    }

    .jtb-key { color: #a78bfa; }
    .jtb-bracket { color: #9ca3af; }
    .jtb-string { color: #34d399; }
    .jtb-number { color: #fbbf24; }
    .jtb-boolean { color: #fb7185; }
    .jtb-comma { color: #6b7280; }
    .jtb-null { color: #6b7280; }

    .jtb-row:hover { background: rgb(37 99 235 / 12%); }

    .jtb-tooltip {
      background: #020617;
      border-color: #475569;
      color: #e5e7eb;
    }

    .jtb-match {
      background: #713f12;
      color: #fef08a;
    }

    #jtb-raw-pre { color: #e5e7eb; }

    .jtb-btn-active {
      background: #1e3a5f;
      border-color: #3b82f6;
      color: #93c5fd;
    }
  }
`

  type NodeStats = {
    objects: number
    arrays: number
    keys: number
    primitives: number
  }

  function computeStats(
    value: unknown,
    acc: NodeStats = { objects: 0, arrays: 0, keys: 0, primitives: 0 },
  ): NodeStats {
    if (Array.isArray(value)) {
      acc.arrays++
      value.forEach((item) => computeStats(item, acc))
    } else if (value !== null && typeof value === "object") {
      acc.objects++

      const entries = Object.entries(value as Record<string, unknown>)

      acc.keys += entries.length
      entries.forEach(([, v]) => computeStats(v, acc))
    } else {
      acc.primitives++
    }

    return acc
  }

  function subtreeMatches(name: string | null, value: unknown, q: string): boolean {
    if (name !== null && name.toLowerCase().includes(q)) {
      return true
    }

    if (Array.isArray(value)) {
      return value.some((v, i) => subtreeMatches(String(i), v, q))
    }

    if (value !== null && typeof value === "object") {
      return Object.entries(value as Record<string, unknown>).some(([k, v]) =>
        subtreeMatches(k, v, q),
      )
    }

    if (typeof value === "string") {
      return value.toLowerCase().includes(q)
    }

    if (value !== null && value !== undefined) {
      return String(value).toLowerCase().includes(q)
    }

    return false
  }

  function highlight(text: string, query: string): HTMLElement | Text {
    if (!query) {
      return document.createTextNode(text)
    }

    const idx = text.toLowerCase().indexOf(query.toLowerCase())

    if (idx === -1) {
      return document.createTextNode(text)
    }

    const span = document.createElement("span")

    span.appendChild(document.createTextNode(text.slice(0, idx)))

    const mark = document.createElement("mark")
    mark.className = "jtb-match"
    mark.textContent = text.slice(idx, idx + query.length)

    span.appendChild(mark)
    span.appendChild(document.createTextNode(text.slice(idx + query.length)))

    return span
  }

  function reindent(input: string, spaces = 2): string {
    const text = input.trim()

    if (!text) {
      return ""
    }

    let output = ""
    let depth = 0
    let inString = false
    let escaped = false

    const indent = () => " ".repeat(depth * spaces)
    const endsWithLineIndent = () => /\n[ \t]*$/.test(output)

    for (let i = 0; i < text.length; i++) {
      const char = text[i]

      if (escaped) {
        output += char
        escaped = false
        continue
      }

      if (char === "\\" && inString) {
        output += char
        escaped = true
        continue
      }

      if (char === '"') {
        output += char
        inString = !inString
        continue
      }

      if (inString) {
        output += char
        continue
      }

      if (char === "{" || char === "[") {
        if (!endsWithLineIndent()) {
          output = output.replace(/[ \t]+$/g, "")
        }

        output += char
        depth += 1
        output += `\n${indent()}`
        continue
      }

      if (char === "}" || char === "]") {
        depth = Math.max(0, depth - 1)
        output = output.trimEnd()
        output += `\n${indent()}${char}`
        continue
      }

      if (char === ",") {
        output = output.trimEnd()
        output += `,\n${indent()}`
        continue
      }

      if (char === ":") {
        output = output.trimEnd()
        output += ": "
        continue
      }

      if (/\s/.test(char)) {
        if (!endsWithLineIndent() && output && !output.endsWith(" ")) {
          output += " "
        }

        continue
      }

      output += char
    }

    return output.trim()
  }

  function cleanTreeCopiedText(value: string) {
    const cleaned = value
      .replace(/\r\n/g, "\n")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+/g, " ")
      .replace(/[ \t]*\n[ \t]*/g, "\n")
      .replace(/"\s*:\s*\n+\s*/g, '": ')
      .replace(/:\s*\n+\s*/g, ": ")
      .replace(/\{\s*\n+\s*/g, "{\n")
      .replace(/\[\s*\n+\s*/g, "[\n")
      .replace(/\n+\s*,/g, ",")
      .replace(/,\s*\n+\s*/g, ",\n")
      .replace(/\n+\s*\}/g, "\n}")
      .replace(/\n+\s*\]/g, "\n]")
      .replace(/\}\s*,\s*\{/g, "},\n{")
      .replace(/\}\s*,\s*$/g, "},")
      .replace(/\n{2,}/g, "\n")
      .trim()

    return reindent(cleaned)
  }

  function removeCopyIgnoredNodes(container: HTMLElement) {
    container
      .querySelectorAll(
        [
          ".jtb-copy-ignore",
          ".jtb-tooltip",
          ".jtb-toggle",
          ".jtb-toggle-gap",
          ".jtb-count",
          ".jtb-hidden",
        ].join(","),
      )
      .forEach((node) => node.remove())
  }

  const nodeRegistry: Array<{
    open: () => boolean
    setOpen: (v: boolean) => void
  }> = []

  let tooltipCounter = 0

  function createTreeRow(path: string) {
    tooltipCounter += 1

    const normalizedPath = path || "root"
    const tooltipId = `jtb-tooltip-${tooltipCounter}`

    const rowWrapper = document.createElement("div")
    rowWrapper.className = "jtb-row-tooltip"

    const row = document.createElement("div")
    row.className = "jtb-row"
    row.setAttribute("aria-describedby", tooltipId)
    row.dataset.treePath = normalizedPath

    const tooltip = document.createElement("div")
    tooltip.id = tooltipId
    tooltip.className = "jtb-tooltip jtb-copy-ignore"
    tooltip.setAttribute("role", "tooltip")
    tooltip.setAttribute("aria-hidden", "true")
    tooltip.textContent = normalizedPath

    rowWrapper.append(row, tooltip)

    return { rowWrapper, row }
  }

  function buildTreeNode(
    name: string | null,
    value: unknown,
    isLast: boolean,
    path: string,
    query: string,
  ): HTMLElement | null {
    const q = query.toLowerCase()

    if (q && !subtreeMatches(name, value, q)) {
      return null
    }

    const wrapper = document.createElement("div")

    if (path) {
      wrapper.className = "jtb-node"
    }

    const isContainer =
      Array.isArray(value) || (value !== null && typeof value === "object")

    if (isContainer) {
      const isArray = Array.isArray(value)
      const entries: Array<[string, unknown]> = isArray
        ? (value as unknown[]).map((v, i) => [String(i), v])
        : Object.entries(value as Record<string, unknown>)

      let isOpen = true

      const { rowWrapper, row } = createTreeRow(path || "root")

      const toggle = document.createElement("button")
      toggle.className = "jtb-toggle jtb-copy-ignore"
      toggle.textContent = "▼"
      toggle.setAttribute("aria-label", "toggle")

      const children = document.createElement("div")

      const closeRow = document.createElement("div")
      closeRow.className = "jtb-row"

      const closeGap = document.createElement("span")
      closeGap.className = "jtb-toggle-gap jtb-copy-ignore"
      closeRow.appendChild(closeGap)

      const countSpan = document.createElement("span")
      countSpan.className = "jtb-count jtb-copy-ignore"
      countSpan.textContent = isArray
        ? ` ${entries.length} items`
        : ` ${entries.length} keys`

      const closeB = document.createElement("span")
      closeB.className = "jtb-bracket"
      closeB.textContent = isArray ? "]" : "}"

      closeRow.appendChild(closeB)

      if (!isLast) {
        const comma = document.createElement("span")
        comma.className = "jtb-comma"
        comma.textContent = ","
        closeRow.appendChild(comma)
      }

      const doToggle = (open: boolean) => {
        isOpen = open
        toggle.textContent = open ? "▼" : "▶"
        children.classList.toggle("jtb-hidden", !open)
        countSpan.classList.toggle("jtb-hidden", open)
        closeRow.classList.toggle("jtb-hidden", !open)
      }

      toggle.addEventListener("click", (e) => {
        e.stopPropagation()
        doToggle(!isOpen)
      })

      nodeRegistry.push({
        open: () => isOpen,
        setOpen: (v) => doToggle(v),
      })

      row.appendChild(toggle)

      if (name !== null) {
        const keySpan = document.createElement("span")
        keySpan.className = "jtb-key"
        keySpan.appendChild(highlight(`"${name}": `, q))
        row.appendChild(keySpan)
      }

      const openB = document.createElement("span")
      openB.className = "jtb-bracket"
      openB.textContent = isArray ? "[" : "{"

      row.appendChild(openB)
      row.appendChild(countSpan)

      entries.forEach(([k, v], i) => {
        const childPath = isArray ? `${path}[${k}]` : `${path ? `${path}.` : ""}${k}`

        const child = buildTreeNode(
          isArray ? null : k,
          v,
          i === entries.length - 1,
          childPath,
          query,
        )

        if (child) {
          children.appendChild(child)
        }
      })

      wrapper.appendChild(rowWrapper)
      wrapper.appendChild(children)
      wrapper.appendChild(closeRow)
    } else {
      const { rowWrapper, row } = createTreeRow(path || "root")

      const gap = document.createElement("span")
      gap.className = "jtb-toggle-gap jtb-copy-ignore"
      row.appendChild(gap)

      if (name !== null) {
        const keySpan = document.createElement("span")
        keySpan.className = "jtb-key"
        keySpan.appendChild(highlight(`"${name}": `, q))
        row.appendChild(keySpan)
      }

      const valSpan = document.createElement("span")

      if (value === null) {
        valSpan.className = "jtb-null"
        valSpan.textContent = "null"
      } else if (typeof value === "string") {
        valSpan.className = "jtb-string"
        valSpan.appendChild(highlight(JSON.stringify(value), q))
      } else if (typeof value === "number") {
        valSpan.className = "jtb-number"
        valSpan.appendChild(highlight(String(value), q))
      } else if (typeof value === "boolean") {
        valSpan.className = "jtb-boolean"
        valSpan.appendChild(highlight(String(value), q))
      } else {
        valSpan.textContent = String(value)
      }

      row.appendChild(valSpan)

      if (!isLast) {
        const comma = document.createElement("span")
        comma.className = "jtb-comma"
        comma.textContent = ","
        row.appendChild(comma)
      }

      wrapper.appendChild(rowWrapper)
    }

    return wrapper
  }

  function renderTree(container: HTMLElement, parsed: unknown, query: string) {
    nodeRegistry.length = 0
    tooltipCounter = 0
    container.innerHTML = ""

    const root = buildTreeNode(null, parsed, true, "", query)

    if (root) {
      container.appendChild(root)
    } else {
      const msg = document.createElement("div")
      msg.className = "jtb-no-results"
      msg.textContent = `No results for "${query}"`
      container.appendChild(msg)
    }
  }

  function extractJson(): { raw: string; parsed: unknown } | null {
    const mime = (document.contentType ?? "").toLowerCase()
    const isJsonMime = mime.includes("json")
    const pre = document.body.querySelector("pre")
    const raw = (pre ? pre.textContent : (document.body.textContent ?? "")).trim()

    if (!raw || (raw[0] !== "{" && raw[0] !== "[")) {
      return null
    }

    if (!isJsonMime) {
      const bodyText = (document.body.textContent ?? "").trim()

      if (Math.abs(bodyText.length - raw.length) > 5) {
        return null
      }

      if (document.body.children.length > 1) {
        return null
      }
    }

    try {
      return { raw, parsed: JSON.parse(raw) }
    } catch {
      return null
    }
  }

  function injectViewer(raw: string, parsed: unknown) {
    const stats = computeStats(parsed)
    const bytes = new Blob([raw]).size

    document.title = `JSON — ${location.hostname}`
    document.body.innerHTML = ""
    document.body.style.margin = "0"
    document.body.style.padding = "0"

    const style = document.createElement("style")
    style.textContent = STYLES
    document.head.appendChild(style)

    const root = document.createElement("div")
    root.id = "jtb-root"

    const header = document.createElement("div")
    header.id = "jtb-header"

    const title = document.createElement("span")
    title.id = "jtb-title"
    title.textContent = "JSON Toolbox"

    const actions = document.createElement("div")
    actions.id = "jtb-actions"

    const searchInput = document.createElement("input")
    searchInput.className = "jtb-search"
    searchInput.type = "search"
    searchInput.placeholder = "Search keys / values…"

    const expandBtn = document.createElement("button")
    expandBtn.className = "jtb-btn"
    expandBtn.textContent = "Expand all"
    expandBtn.addEventListener("click", () =>
      nodeRegistry.forEach((n) => n.setOpen(true)),
    )

    const collapseBtn = document.createElement("button")
    collapseBtn.className = "jtb-btn"
    collapseBtn.textContent = "Collapse all"
    collapseBtn.addEventListener("click", () =>
      nodeRegistry.forEach((n) => n.setOpen(false)),
    )

    let currentView: "tree" | "raw" = "tree"

    const treeBtn = document.createElement("button")
    treeBtn.className = "jtb-btn jtb-btn-active"
    treeBtn.textContent = "Tree"

    const rawBtn = document.createElement("button")
    rawBtn.className = "jtb-btn"
    rawBtn.textContent = "Raw"

    const copyBtn = document.createElement("button")
    copyBtn.className = "jtb-btn"
    copyBtn.textContent = "Copy"
    copyBtn.addEventListener("click", () => {
      const text = currentView === "raw" ? raw : JSON.stringify(parsed, null, 2)

      void navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = "Copied!"

        setTimeout(() => {
          copyBtn.textContent = "Copy"
        }, 1500)
      })
    })

    const openBtn = document.createElement("button")
    openBtn.className = "jtb-btn jtb-btn-primary"
    openBtn.textContent = "Open in Editor"
    openBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "open-editor", json: raw })
    })

    actions.append(searchInput, expandBtn, collapseBtn, treeBtn, rawBtn, copyBtn, openBtn)

    header.append(title, actions)

    const statsBar = document.createElement("div")
    statsBar.id = "jtb-stats"

    const sizeLabel = bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`

    ;[
      `Objects: ${stats.objects}`,
      `Arrays: ${stats.arrays}`,
      `Keys: ${stats.keys}`,
      `Primitives: ${stats.primitives}`,
      sizeLabel,
    ].forEach((text) => {
      const s = document.createElement("span")
      s.className = "jtb-stat"
      s.textContent = text
      statsBar.appendChild(s)
    })

    const treeContainer = document.createElement("div")
    treeContainer.id = "jtb-tree"
    renderTree(treeContainer, parsed, "")

    let searchTimer: ReturnType<typeof setTimeout>

    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer)

      searchTimer = setTimeout(() => {
        renderTree(treeContainer, parsed, searchInput.value)
      }, 250)
    })

    treeContainer.addEventListener("copy", (event) => {
      const selection = window.getSelection()

      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        return
      }

      const container = document.createElement("div")

      for (let index = 0; index < selection.rangeCount; index += 1) {
        container.appendChild(selection.getRangeAt(index).cloneContents())
      }

      removeCopyIgnoredNodes(container)

      const cleaned = cleanTreeCopiedText(container.textContent ?? "")

      if (!cleaned) {
        return
      }

      event.preventDefault()
      event.clipboardData?.setData("text/plain", cleaned)
    })

    const rawContainer = document.createElement("div")
    rawContainer.id = "jtb-raw"
    rawContainer.className = "jtb-hidden"

    const rawPre = document.createElement("pre")
    rawPre.id = "jtb-raw-pre"
    rawPre.textContent = JSON.stringify(parsed, null, 2)

    rawContainer.appendChild(rawPre)

    function setView(view: "tree" | "raw") {
      currentView = view

      const isTree = view === "tree"

      treeBtn.className = isTree ? "jtb-btn jtb-btn-active" : "jtb-btn"
      rawBtn.className = isTree ? "jtb-btn" : "jtb-btn jtb-btn-active"

      treeContainer.classList.toggle("jtb-hidden", !isTree)
      rawContainer.classList.toggle("jtb-hidden", isTree)

      searchInput.classList.toggle("jtb-hidden", !isTree)
      expandBtn.classList.toggle("jtb-hidden", !isTree)
      collapseBtn.classList.toggle("jtb-hidden", !isTree)
    }

    treeBtn.addEventListener("click", () => setView("tree"))
    rawBtn.addEventListener("click", () => setView("raw"))

    root.append(header, statsBar, treeContainer, rawContainer)
    document.body.appendChild(root)
  }

  if (!document.getElementById("jtb-root")) {
    const result = extractJson()

    if (result) {
      injectViewer(result.raw, result.parsed)
    }
  }
})()
