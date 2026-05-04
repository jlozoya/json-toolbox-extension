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
  JSON_TRANSFORM_OPTIONS,
  transformJsonValue,
  transformRawText,
  transformRequiresJson,
  type JsonTransformKind,
} from "../lib/json-transformers"
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
  "userId": 1,
  "id": 1,
  "title": "delectus aut autem",
  "completed": false
}`

export function EditorApp() {
  const [input, setInput] = useState(sampleJson)
  const [output, setOutput] = useState("")
  const [parsedValue, setParsedValue] = useState<unknown | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabValue>("format")
  const [transformKind, setTransformKind] = useState<JsonTransformKind>("xml")
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

  const selectedTransform = JSON_TRANSFORM_OPTIONS.find(
    (option) => option.value === transformKind,
  )

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

    setActiveTab("format")
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

    setActiveTab("format")
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

    setActiveTab("format")
    setParsedValue(sorted)
    setOutput(formatted)
    setInput(formatted)

    await addHistoryItem(formatted)
    setHistory(await getHistory())
  }

  async function handleTransform() {
    try {
      setActiveTab("transform")

      if (!input.trim()) {
        setError("Input is empty.")
        setOutput("")
        return
      }

      if (!transformRequiresJson(transformKind)) {
        const transformed = transformRawText(transformKind, input)

        setOutput(transformed)
        setError(null)

        const parsed = formatJson(transformed, settings.indentSize)

        if (parsed.ok) {
          setParsedValue(parsed.value)
        }

        return
      }

      const result = parseCurrentInput()

      if (!result) {
        setOutput("")
        return
      }

      const transformed = transformJsonValue(
        transformKind,
        result.value,
        input,
        settings.indentSize,
      )

      setOutput(transformed)
      setError(null)

      await addHistoryItem(result.formatted)
      setHistory(await getHistory())
    } catch (err) {
      setOutput("")
      setError(err instanceof Error ? err.message : String(err))
    }
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

  function handleUseOutputAsInput() {
    if (!output) {
      return
    }

    setInput(output)
    setOutput("")
    setParsedValue(null)
    setError(null)
    setActiveTab("format")
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

      <div className="sticky-actions">
        <div className="toolbar-card">
          <Toolbar
            indentSize={settings.indentSize}
            onIndentSizeChange={handleIndentSizeChange}
            onFormat={handleFormat}
            onMinify={handleMinify}
            onSortKeys={handleSortKeys}
            onTransform={handleTransform}
            onCopyOutput={handleCopyOutput}
            onClear={handleClear}
          />

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
        </div>
      </div>

      <ErrorPanel error={error} />

      {activeTab === "history" ? (
        <HistoryPanel
          history={history}
          onLoad={handleLoadHistoryItem}
          onClear={handleClearHistory}
        />
      ) : (
        <div className="editor-grid">
          <section className="card panel editor-panel">
            <div className="panel-header">
              <span className="panel-title">Input</span>
              <span className="panel-hint">Paste JSON or encoded text</span>
            </div>

            <textarea
              className="textarea"
              value={input}
              spellCheck={false}
              placeholder="Paste JSON here…"
              onChange={(event) => setInput(event.target.value)}
            />
          </section>

          <section className="card panel editor-panel">
            <div className="panel-header">
              <span className="panel-title">Output</span>

              {output && (
                <button
                  className="button button-small"
                  type="button"
                  onClick={handleUseOutputAsInput}
                >
                  Use as input
                </button>
              )}
            </div>

            {activeTab === "format" && (
              <pre className="output-box">
                {output || "Run Format, Minify or Sort keys."}
              </pre>
            )}

            {activeTab === "tree" &&
              (parsedValue ? (
                <JsonTree value={parsedValue} />
              ) : (
                <div className="output-box output-box-empty">
                  Run Format first or switch tabs again.
                </div>
              ))}

            {activeTab === "transform" && (
              <div className="transform-layout">
                <div className="transform-panel">
                  <div className="transform-main">
                    <label className="field">
                      <span className="field-label">Transform type</span>
                      <select
                        className="select"
                        value={transformKind}
                        onChange={(event) =>
                          setTransformKind(event.target.value as JsonTransformKind)
                        }
                      >
                        {JSON_TRANSFORM_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <button
                      className="button button-primary transform-button"
                      type="button"
                      onClick={handleTransform}
                    >
                      Generate
                    </button>
                  </div>

                  <div className="transform-meta">
                    <strong>{selectedTransform?.label}</strong>
                    <span>{selectedTransform?.description}</span>
                  </div>
                </div>

                <pre className="output-box">
                  {output || "Select a transform and click Generate."}
                </pre>
              </div>
            )}

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
