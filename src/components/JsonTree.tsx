import { useCallback, useId, useState, type ChangeEvent, type ReactNode } from "react"

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

      <div className="output-box">
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
            className="tree-toggle"
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

          {!open && <span className="tree-count">{value.length} items</span>}
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
            className="tree-toggle"
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

          {!open && <span className="tree-count">{entries.length} keys</span>}
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
          <span className="tree-bracket">{"}"}</span>
          {!isLast && <span className="tree-comma">,</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="tree-node">
      <TreeRowWithTooltip nodePath={nodePath}>
        <span className="tree-toggle-gap" />

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
      <div className="tree-row" aria-describedby={tooltipId}>
        {children}
      </div>

      <div id={tooltipId} className="tree-tooltip" role="tooltip">
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