import {
  useCallback,
  useId,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type ReactNode,
} from "react"

type JsonTreeProps = {
  value: unknown
}

export function JsonTree({ value }: JsonTreeProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [treeKey, setTreeKey] = useState(0)
  const [defaultOpen, setDefaultOpen] = useState(true)

  const expandAll = useCallback(() => {
    setDefaultOpen(true)
    setTreeKey((k) => k + 1)
  }, [])

  const collapseAll = useCallback(() => {
    setDefaultOpen(false)
    setTreeKey((k) => k + 1)
  }, [])

  const hasResults =
    !searchQuery || subtreeMatches(null, value, searchQuery.toLowerCase())

  function handleTreeCopy(event: ClipboardEvent<HTMLDivElement>) {
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
    event.clipboardData.setData("text/plain", cleaned)
  }

  return (
    <div>
      <div className="tree-controls">
        <input
          className="tree-search"
          type="search"
          placeholder="Search keys or values…"
          value={searchQuery}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setSearchQuery(event.target.value)
          }
        />

        <button className="button" type="button" onClick={expandAll}>
          Expand all
        </button>

        <button className="button" type="button" onClick={collapseAll}>
          Collapse all
        </button>
      </div>

      <div className="output-box" onCopy={handleTreeCopy}>
        {hasResults ? (
          <TreeNode
            key={treeKey}
            name={null}
            value={value}
            isLast={true}
            path=""
            defaultOpen={defaultOpen}
            searchQuery={searchQuery}
          />
        ) : (
          <div className="tree-no-results">No results for "{searchQuery}"</div>
        )}
      </div>
    </div>
  )
}

function removeCopyIgnoredNodes(container: HTMLElement) {
  container
    .querySelectorAll(
      [
        ".tree-tooltip",
        ".tree-toggle",
        ".tree-toggle-gap",
        ".tree-count",
        ".tree-copy-ignore",
      ].join(","),
    )
    .forEach((node) => node.remove())
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

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]

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

function subtreeMatches(name: string | null, value: unknown, q: string): boolean {
  if (!q) {
    return true
  }

  if (name !== null && name.toLowerCase().includes(q)) {
    return true
  }

  if (Array.isArray(value)) {
    return value.some((item, index) => subtreeMatches(String(index), item, q))
  }

  if (value !== null && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(([key, childValue]) =>
      subtreeMatches(key, childValue, q),
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

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) {
    return <>{text}</>
  }

  const index = text.toLowerCase().indexOf(query.toLowerCase())

  if (index === -1) {
    return <>{text}</>
  }

  return (
    <>
      {text.slice(0, index)}
      <mark className="tree-match">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  )
}

type TreeNodeProps = {
  name: string | null
  value: unknown
  isLast: boolean
  path: string
  defaultOpen: boolean
  searchQuery: string
}

function TreeNode({
  name,
  value,
  isLast,
  path,
  defaultOpen,
  searchQuery,
}: TreeNodeProps) {
  const [open, setOpen] = useState(defaultOpen)
  const query = searchQuery.toLowerCase()

  if (query && !subtreeMatches(name, value, query)) {
    return null
  }

  const nodePath = path || "root"

  if (Array.isArray(value)) {
    return (
      <div className="tree-node">
        <TreeRowWithTooltip nodePath={nodePath}>
          <button
            className="tree-toggle tree-copy-ignore"
            type="button"
            aria-label={open ? `Collapse ${nodePath}` : `Expand ${nodePath}`}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? "▼" : "▶"}
          </button>

          {name !== null && (
            <span className="tree-key">
              "<Highlight text={name} query={searchQuery} />":&nbsp;
            </span>
          )}

          <span className="tree-bracket">[</span>

          {!open && (
            <span className="tree-count tree-copy-ignore">
              {value.length} items
            </span>
          )}
        </TreeRowWithTooltip>

        {open &&
          value.map((item, index) => (
            <TreeNode
              key={index}
              name={null}
              value={item}
              isLast={index === value.length - 1}
              path={`${path}[${index}]`}
              defaultOpen={defaultOpen}
              searchQuery={searchQuery}
            />
          ))}

        <div className="tree-row">
          <span className="tree-toggle-gap tree-copy-ignore" />
          <span className="tree-bracket">]</span>
          {!isLast && <span className="tree-comma">,</span>}
        </div>
      </div>
    )
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)

    return (
      <div className="tree-node">
        <TreeRowWithTooltip nodePath={nodePath}>
          <button
            className="tree-toggle tree-copy-ignore"
            type="button"
            aria-label={open ? `Collapse ${nodePath}` : `Expand ${nodePath}`}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? "▼" : "▶"}
          </button>

          {name !== null && (
            <span className="tree-key">
              "<Highlight text={name} query={searchQuery} />":&nbsp;
            </span>
          )}

          <span className="tree-bracket">{"{"}</span>

          {!open && (
            <span className="tree-count tree-copy-ignore">
              {entries.length} keys
            </span>
          )}
        </TreeRowWithTooltip>

        {open &&
          entries.map(([key, childValue], index) => (
            <TreeNode
              key={key}
              name={key}
              value={childValue}
              isLast={index === entries.length - 1}
              path={`${path ? `${path}.` : ""}${key}`}
              defaultOpen={defaultOpen}
              searchQuery={searchQuery}
            />
          ))}

        <div className="tree-row">
          <span className="tree-toggle-gap tree-copy-ignore" />
          <span className="tree-bracket">{"}"}</span>
          {!isLast && <span className="tree-comma">,</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="tree-node">
      <TreeRowWithTooltip nodePath={nodePath}>
        <span className="tree-toggle-gap tree-copy-ignore" />

        {name !== null && (
          <span className="tree-key">
            "<Highlight text={name} query={searchQuery} />":&nbsp;
          </span>
        )}

        <PrimitiveValue value={value} searchQuery={searchQuery} />

        {!isLast && <span className="tree-comma">,</span>}
      </TreeRowWithTooltip>
    </div>
  )
}

function TreeRowWithTooltip({
  nodePath,
  children,
}: {
  nodePath: string
  children: ReactNode
}) {
  const tooltipId = useId()

  return (
    <div className="tree-row-tooltip">
      <div className="tree-row" aria-describedby={tooltipId} data-tree-path={nodePath}>
        {children}
      </div>

      <div
        id={tooltipId}
        className="tree-tooltip tree-copy-ignore"
        role="tooltip"
        aria-hidden="true"
      >
        {nodePath}
      </div>
    </div>
  )
}

function PrimitiveValue({
  value,
  searchQuery,
}: {
  value: unknown
  searchQuery: string
}) {
  if (value === null) {
    return <span className="tree-value-null">null</span>
  }

  if (typeof value === "string") {
    return (
      <span className="tree-value-string">
        "<Highlight text={value} query={searchQuery} />"
      </span>
    )
  }

  if (typeof value === "number") {
    return (
      <span className="tree-value-number">
        <Highlight text={String(value)} query={searchQuery} />
      </span>
    )
  }

  if (typeof value === "boolean") {
    return (
      <span className="tree-value-boolean">
        <Highlight text={String(value)} query={searchQuery} />
      </span>
    )
  }

  return <span>{String(value)}</span>
}