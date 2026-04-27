import { useEffect, useMemo, useState } from "react"
import { ErrorPanel } from "../components/ErrorPanel"
import { JsonTree } from "../components/JsonTree"
import { Tabs, type TabValue } from "../components/Tabs"
import { Toolbar } from "../components/Toolbar"
import { copyToClipboard } from "../lib/clipboard"
import { formatJson, sortJsonKeys } from "../lib/json-format"
import { extractJsonPaths } from "../lib/json-paths"
import { getJsonStats } from "../lib/json-stats"
import { jsonToTypeScript } from "../lib/json-to-typescript"
import {
  addHistoryItem,
  clearHistory,
  getHistory,
  getSettings,
  saveSettings,
  type JsonHistoryItem,
  type JsonToolboxSettings,
} from "../lib/storage"

const sampleJson = `{
  "name": "JSON Toolbox",
  "version": "0.1.0",
  "features": [
    "format",
    "minify",
    "sort keys",
    "tree viewer",
    "paths",
    "typescript types"
  ],
  "active": true
}`

export function EditorApp() {
  const [input, setInput] = useState(sampleJson)
  const [output, setOutput] = useState("")
  const [parsedValue, setParsedValue] = useState<unknown | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabValue>("format")
  const [settings, setSettings] = useState<JsonToolboxSettings>({
    indentSize: 2,
    defaultView: "format",
  })
  const [history, setHistory] = useState<JsonHistoryItem[]>([])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const text = params.get("text")

    if (text) {
      setInput(text)
    }
  }, [])

  useEffect(() => {
    async function load() {
      const loadedSettings = await getSettings()
      const loadedHistory = await getHistory()

      setSettings(loadedSettings)
      setActiveTab(loadedSettings.defaultView)
      setHistory(loadedHistory)
    }

    void load()
  }, [])

  const stats = useMemo(() => {
    if (!parsedValue) {
      return null
    }

    return getJsonStats(parsedValue, output || input)
  }, [parsedValue, output, input])

  const paths = useMemo(() => {
    if (!parsedValue) {
      return []
    }

    return extractJsonPaths(parsedValue)
  }, [parsedValue])

  const typescriptOutput = useMemo(() => {
    if (!parsedValue) {
      return ""
    }

    return jsonToTypeScript(parsedValue, {
      rootName: "Root",
    })
  }, [parsedValue])

  function parseCurrentInput() {
    const result = formatJson(input, settings.indentSize)

    if (!result.ok) {
      setError(result.error)
      setParsedValue(null)
      return null
    }

    setError(null)
    setParsedValue(result.value)
    return result
  }

  async function handleFormat() {
    const result = parseCurrentInput()

    if (!result) {
      setOutput("")
      return
    }

    setOutput(result.formatted)
    setInput(result.formatted)
    await addHistoryItem(result.formatted)
    setHistory(await getHistory())
  }

  async function handleMinify() {
    const result = parseCurrentInput()

    if (!result) {
      setOutput("")
      return
    }

    setOutput(result.minified)
    setInput(result.minified)
    await addHistoryItem(result.minified)
    setHistory(await getHistory())
  }

  async function handleSortKeys() {
    const result = parseCurrentInput()

    if (!result) {
      setOutput("")
      return
    }

    const sorted = sortJsonKeys(result.value)
    const formatted = JSON.stringify(sorted, null, settings.indentSize)

    setParsedValue(sorted)
    setOutput(formatted)
    setInput(formatted)

    await addHistoryItem(formatted)
    setHistory(await getHistory())
  }

  async function handleCopyOutput() {
    await copyToClipboard(getCurrentOutput())
  }

  function handleClear() {
    setInput("")
    setOutput("")
    setParsedValue(null)
    setError(null)
  }

  async function handleIndentSizeChange(indentSize: 2 | 4) {
    const nextSettings = {
      ...settings,
      indentSize,
    }

    setSettings(nextSettings)
    await saveSettings(nextSettings)
  }

  async function handleTabChange(tab: TabValue) {
    setActiveTab(tab)

    const nextSettings = {
      ...settings,
      defaultView: tab,
    }

    setSettings(nextSettings)
    await saveSettings(nextSettings)

    if (tab !== "history") {
      parseCurrentInput()
    }
  }

  async function handleClearHistory() {
    await clearHistory()
    setHistory([])
  }

  function handleLoadHistoryItem(item: JsonHistoryItem) {
    setInput(item.input)
    setOutput(item.input)
    setActiveTab("format")

    const result = formatJson(item.input, settings.indentSize)

    if (result.ok) {
      setParsedValue(result.value)
      setError(null)
    }
  }

  function getCurrentOutput() {
    if (activeTab === "types") {
      return typescriptOutput
    }

    if (activeTab === "paths") {
      return paths.join("\n")
    }

    return output || input
  }

  return (
    <div className="app-shell">
      <header className="header">
        <div>
          <h1 className="header-title">JSON Toolbox</h1>
          <p className="header-subtitle">
            Format, validate, inspect and transform JSON payloads.
          </p>
        </div>
      </header>

      <Toolbar
        indentSize={settings.indentSize}
        onIndentSizeChange={handleIndentSizeChange}
        onFormat={handleFormat}
        onMinify={handleMinify}
        onSortKeys={handleSortKeys}
        onCopyOutput={handleCopyOutput}
        onClear={handleClear}
      />

      <ErrorPanel error={error} />

      {stats && (
        <div className="stats">
          <span className="stat">Objects: {stats.objects}</span>
          <span className="stat">Arrays: {stats.arrays}</span>
          <span className="stat">Keys: {stats.keys}</span>
          <span className="stat">Primitives: {stats.primitives}</span>
          <span className="stat">Bytes: {stats.bytes}</span>
        </div>
      )}

      <Tabs value={activeTab} onChange={handleTabChange} />

      {activeTab === "history" ? (
        <HistoryPanel
          history={history}
          onLoad={handleLoadHistoryItem}
          onClear={handleClearHistory}
        />
      ) : (
        <div className="editor-grid">
          <section className="card panel">
            <div className="panel-header">
              <span className="panel-title">Input</span>
            </div>

            <textarea
              className="textarea"
              value={input}
              spellCheck={false}
              onChange={(event) => setInput(event.target.value)}
            />
          </section>

          <section className="card panel">
            <div className="panel-header">
              <span className="panel-title">Output</span>
            </div>

            {activeTab === "format" && (
              <pre className="output-box">{output || "Run Format, Minify or Sort keys."}</pre>
            )}

            {activeTab === "tree" &&
              (parsedValue ? (
                <JsonTree value={parsedValue} />
              ) : (
                <div className="output-box">Run Format first or switch tabs again.</div>
              ))}

            {activeTab === "types" && (
              <pre className="output-box">
                {typescriptOutput || "Run Format first or switch tabs again."}
              </pre>
            )}

            {activeTab === "paths" && (
              <pre className="output-box">
                {paths.length > 0
                  ? paths.join("\n")
                  : "Run Format first or switch tabs again."}
              </pre>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

type HistoryPanelProps = {
  history: JsonHistoryItem[]
  onLoad: (item: JsonHistoryItem) => void
  onClear: () => void
}

function HistoryPanel({ history, onLoad, onClear }: HistoryPanelProps) {
  return (
    <section className="card panel">
      <div className="panel-header">
        <span className="panel-title">History</span>

        <button className="button button-danger" type="button" onClick={onClear}>
          Clear history
        </button>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">No JSON history yet.</div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <button
              key={item.id}
              className="history-item"
              type="button"
              onClick={() => onLoad(item)}
            >
              <div className="history-title">
                {new Date(item.createdAt).toLocaleString()}
              </div>
              <div className="history-preview">{item.input}</div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}