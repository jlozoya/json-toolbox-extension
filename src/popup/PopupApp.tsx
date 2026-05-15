import { useMemo, useState } from "react"
import { ErrorPanel } from "../components/ErrorPanel"
import { copyToClipboard } from "../lib/clipboard"
import { formatJson } from "../lib/json-format"
import { storeEditorPayload } from "../lib/storage"

const sampleJson = `{"name":"JSON Toolbox","features":["format","minify","validate"]}`

export function PopupApp() {
  const [input, setInput] = useState(sampleJson)
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const canOpenEditor = useMemo(() => {
    return typeof chrome !== "undefined" && Boolean(chrome.tabs)
  }, [])

  function clearStatus() {
    setStatusMessage(null)
  }

  function handleFormat() {
    clearStatus()

    const result = formatJson(input, 2)

    if (!result.ok) {
      setError(result.error)
      setOutput("")
      return
    }

    setError(null)
    setOutput(result.formatted)
  }

  function handleMinify() {
    clearStatus()

    const result = formatJson(input, 2)

    if (!result.ok) {
      setError(result.error)
      setOutput("")
      return
    }

    setError(null)
    setOutput(result.minified)
  }

  async function handleOpenEditor() {
    clearStatus()

    if (!canOpenEditor) {
      setError("Cannot open the full editor in this browser context.")
      return
    }

    const editorUrl = chrome.runtime.getURL("editor.html")
    const payloadId = await storeEditorPayload(input)

    await chrome.tabs.create({
      url: payloadId
        ? `${editorUrl}?payloadId=${encodeURIComponent(payloadId)}`
        : `${editorUrl}?text=${encodeURIComponent(input)}`,
    })
  }

  async function handleCopy() {
    clearStatus()

    const result = await copyToClipboard(output || input)

    if (!result.ok) {
      setError(result.error)
      return
    }

    setError(null)
    setStatusMessage("Copied.")
  }

  return (
    <div className="popup-shell">
      <header className="header">
        <div>
          <h1 className="header-title">JSON Toolbox</h1>
          <p className="header-subtitle">Format, minify and validate JSON.</p>
        </div>
      </header>

      <div className="toolbar">
        <button className="button button-primary" type="button" onClick={handleFormat}>
          Format
        </button>
        <button className="button" type="button" onClick={handleMinify}>
          Minify
        </button>
        <button className="button" type="button" onClick={handleCopy}>
          Copy
        </button>
        <button className="button" type="button" onClick={handleOpenEditor}>
          Full editor
        </button>
      </div>

      <ErrorPanel error={error} />

      {statusMessage && <div className="success-panel">{statusMessage}</div>}

      <div className="card panel">
        <div className="panel-header">
          <span className="panel-title">Input</span>
        </div>

        <textarea
          className="textarea popup-textarea"
          value={input}
          spellCheck={false}
          onChange={(event) => {
            clearStatus()
            setInput(event.target.value)
          }}
        />
      </div>

      {output && (
        <div className="card panel popup-output-panel">
          <div className="panel-header">
            <span className="panel-title">Output</span>
          </div>

          <pre className="output-box popup-output-box">{output}</pre>
        </div>
      )}
    </div>
  )
}
