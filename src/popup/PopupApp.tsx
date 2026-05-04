import { useMemo, useState } from "react"
import { ErrorPanel } from "../components/ErrorPanel"
import { copyToClipboard } from "../lib/clipboard"
import { formatJson } from "../lib/json-format"

const sampleJson = `{"name":"JSON Toolbox","features":["format","minify","validate"]}`

export function PopupApp() {
  const [input, setInput] = useState(sampleJson)
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)

  const canOpenEditor = useMemo(() => {
    return typeof chrome !== "undefined" && Boolean(chrome.tabs)
  }, [])

  function handleFormat() {
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
    if (!canOpenEditor) {
      return
    }

    const url = chrome.runtime.getURL(`editor.html?text=${encodeURIComponent(input)}`)

    await chrome.tabs.create({ url })
  }

  async function handleCopy() {
    await copyToClipboard(output || input)
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

      <div className="card panel">
        <div className="panel-header">
          <span className="panel-title">Input</span>
        </div>

        <textarea
          className="textarea popup-textarea"
          value={input}
          spellCheck={false}
          onChange={(event) => setInput(event.target.value)}
        />
      </div>

      {output && (
        <div className="card panel" style={{ marginTop: 12 }}>
          <div className="panel-header">
            <span className="panel-title">Output</span>
          </div>

          <pre className="output-box popup-output-box">{output}</pre>
        </div>
      )}
    </div>
  )
}
