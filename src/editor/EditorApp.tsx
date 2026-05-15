import { useEffect, useMemo, useState } from "react"
import { ErrorPanel } from "../components/ErrorPanel"
import { JsonTree } from "../components/JsonTree"
import { Tabs, type TabValue } from "../components/Tabs"
import { Toolbar } from "../components/Toolbar"
import { copyToClipboard } from "../lib/clipboard"
import { formatJson, sortJsonKeys, type JsonFormatResult } from "../lib/json-format"
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
  getEditorPayload,
  getHistory,
  getSettings,
  removeEditorPayload,
  saveSettings,
  type JsonHistoryItem,
  type JsonToolboxSettings,
} from "../lib/storage"

type SuccessfulJsonFormatResult = Extract<JsonFormatResult, { ok: true }>

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
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabValue>("format")
  const [transformKind, setTransformKind] = useState<JsonTransformKind>("xml")
  const [settings, setSettings] = useState<JsonToolboxSettings>({
    indentSize: 2,
    defaultView: "format",
    saveHistory: false,
  })
  const [history, setHistory] = useState<JsonHistoryItem[]>([])
  const [clearArmed, setClearArmed] = useState(false)
  const [clearHistoryArmed, setClearHistoryArmed] = useState(false)

  useEffect(() => {
    async function loadInitialState() {
      const params = new URLSearchParams(window.location.search)
      const payloadId = params.get("payloadId")
      const text = params.get("text")

      const [loadedSettings, loadedHistory] = await Promise.all([
        getSettings(),
        getHistory(),
      ])

      setSettings(loadedSettings)
      setActiveTab(loadedSettings.defaultView)
      setHistory(loadedHistory)

      if (payloadId) {
        const payload = await getEditorPayload(payloadId)

        if (payload) {
          setInput(payload)
          await removeEditorPayload(payloadId)
          return
        }
      }

      if (text) {
        setInput(text)
      }
    }

    void loadInitialState()
  }, [])

  useEffect(() => {
    if (!clearArmed) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setClearArmed(false)
    }, 2500)

    return () => window.clearTimeout(timeout)
  }, [clearArmed])

  useEffect(() => {
    if (!clearHistoryArmed) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      setClearHistoryArmed(false)
    }, 2500)

    return () => window.clearTimeout(timeout)
  }, [clearHistoryArmed])

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

  function clearStatus() {
    setStatusMessage(null)
  }

  function parseCurrentInput(showError = true): SuccessfulJsonFormatResult | null {
    const result = formatJson(input, settings.indentSize)

    if (!result.ok) {
      if (showError) {
        setError(result.error)
      }

      setParsedValue(null)
      return null
    }

    setError(null)
    setParsedValue(result.value)
    return result
  }

  async function refreshHistory() {
    setHistory(await getHistory())
  }

  async function saveHistoryItem(inputValue: string) {
    await addHistoryItem(inputValue, settings.saveHistory)
    await refreshHistory()
  }

  async function handleFormat() {
    clearStatus()

    const result = parseCurrentInput()

    if (!result) {
      setOutput("")
      return
    }

    setActiveTab("format")
    setOutput(result.formatted)
    setInput(result.formatted)

    await saveHistoryItem(result.formatted)
  }

  async function handleMinify() {
    clearStatus()

    const result = parseCurrentInput()

    if (!result) {
      setOutput("")
      return
    }

    setActiveTab("format")
    setOutput(result.minified)
    setInput(result.minified)

    await saveHistoryItem(result.minified)
  }

  async function handleSortKeys() {
    clearStatus()

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

    await saveHistoryItem(formatted)
  }

  async function handleTransform() {
    try {
      clearStatus()
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

      await saveHistoryItem(result.formatted)
    } catch (err) {
      setOutput("")
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  async function handleCopyOutput() {
    clearStatus()

    const result = await copyToClipboard(getCurrentOutput())

    if (!result.ok) {
      setError(result.error)
      return
    }

    setError(null)
    setStatusMessage("Copied.")
  }

  function handleClear() {
    clearStatus()

    if (!clearArmed && (input || output)) {
      setClearArmed(true)
      setStatusMessage("Click Clear again to remove the current input and output.")
      return
    }

    setInput("")
    setOutput("")
    setParsedValue(null)
    setError(null)
    setClearArmed(false)
  }

  function handleUseOutputAsInput() {
    if (!output) {
      return
    }

    clearStatus()
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

    if (parsedValue) {
      parseCurrentInput(false)
    }
  }

  async function handleSaveHistoryChange(saveHistory: boolean) {
    const nextSettings = {
      ...settings,
      saveHistory,
    }

    setSettings(nextSettings)
    await saveSettings(nextSettings)

    setStatusMessage(
      saveHistory
        ? "History saving is enabled for future JSON actions."
        : "History saving is disabled.",
    )
  }

  async function handleTabChange(tab: TabValue) {
    clearStatus()
    setActiveTab(tab)

    const nextSettings = {
      ...settings,
      defaultView: tab,
    }

    setSettings(nextSettings)
    await saveSettings(nextSettings)

    if (tab !== "history") {
      parseCurrentInput(tab !== "format")
    }
  }

  async function handleClearHistory() {
    clearStatus()

    if (!clearHistoryArmed && history.length > 0) {
      setClearHistoryArmed(true)
      setStatusMessage("Click Clear history again to permanently clear saved history.")
      return
    }

    await clearHistory()
    setHistory([])
    setClearHistoryArmed(false)
    setStatusMessage("History cleared.")
  }

  function handleLoadHistoryItem(item: JsonHistoryItem) {
    clearStatus()
    setInput(item.input)
    setOutput(item.input)
    setActiveTab("format")

    const result = formatJson(item.input, settings.indentSize)

    if (result.ok) {
      setParsedValue(result.value)
      setError(null)
    }
  }

  function handleInputChange(value: string) {
    clearStatus()
    setInput(value)
    setOutput("")
    setParsedValue(null)

    if (!value.trim()) {
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

          <div className="toolbar-meta-row">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={settings.saveHistory}
                onChange={(event) => handleSaveHistoryChange(event.target.checked)}
              />
              <span>Save history</span>
            </label>

            {stats && (
              <div className="stats" aria-label="JSON statistics">
                <span className="stat">Objects: {stats.objects}</span>
                <span className="stat">Arrays: {stats.arrays}</span>
                <span className="stat">Keys: {stats.keys}</span>
                <span className="stat">Primitives: {stats.primitives}</span>
                <span className="stat">Bytes: {stats.bytes}</span>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onChange={handleTabChange} />
        </div>
      </div>

      <ErrorPanel error={error} />

      {statusMessage && <div className="success-panel">{statusMessage}</div>}

      {activeTab === "history" ? (
        <HistoryPanel
          history={history}
          saveHistory={settings.saveHistory}
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
              onChange={(event) => handleInputChange(event.target.value)}
            />
          </section>

          <section className="card panel editor-panel">
            <div className="panel-header">
              <span className="panel-title">Output</span>

              {output && (
                <button
                  className="button button-small panel-header-action"
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
                  Paste valid JSON, then open this tab again or click Format.
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
                {typescriptOutput ||
                  "Paste valid JSON, then open this tab again or click Format."}
              </pre>
            )}

            {activeTab === "paths" && (
              <pre className="output-box">
                {paths.length > 0
                  ? paths.join("\n")
                  : "Paste valid JSON, then open this tab again or click Format."}
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
  saveHistory: boolean
  onLoad: (item: JsonHistoryItem) => void
  onClear: () => void
}

function HistoryPanel({ history, saveHistory, onLoad, onClear }: HistoryPanelProps) {
  return (
    <section className="card panel">
      <div className="panel-header">
        <div>
          <span className="panel-title">History</span>
          <p className="panel-description">
            {saveHistory
              ? "Saved locally on this browser."
              : "History saving is disabled. Existing items remain until cleared."}
          </p>
        </div>

        <button
          className="button button-small button-danger panel-header-action"
          type="button"
          onClick={onClear}
        >
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
