type ToolbarProps = {
  indentSize: 2 | 4
  onIndentSizeChange: (value: 2 | 4) => void
  onFormat: () => void
  onMinify: () => void
  onSortKeys: () => void
  onTransform: () => void
  onCopyOutput: () => void
  onClear: () => void
}

export function Toolbar({
  indentSize,
  onIndentSizeChange,
  onFormat,
  onMinify,
  onSortKeys,
  onTransform,
  onCopyOutput,
  onClear,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-group toolbar-group-primary" aria-label="JSON actions">
        <button className="button button-primary" type="button" onClick={onFormat}>
          Format
        </button>

        <button className="button" type="button" onClick={onMinify}>
          Minify
        </button>

        <button className="button" type="button" onClick={onSortKeys}>
          Sort keys
        </button>
      </div>

      <div className="toolbar-group toolbar-group-secondary" aria-label="Output actions">
        <select
          className="select toolbar-select"
          aria-label="Indent size"
          value={indentSize}
          onChange={(event) =>
            onIndentSizeChange(Number(event.target.value) === 4 ? 4 : 2)
          }
        >
          <option value={2}>2 spaces</option>
          <option value={4}>4 spaces</option>
        </select>

        <button className="button" type="button" onClick={onTransform}>
          Transform
        </button>

        <button className="button" type="button" onClick={onCopyOutput}>
          Copy output
        </button>

        <button className="button button-danger" type="button" onClick={onClear}>
          Clear
        </button>
      </div>
    </div>
  )
}
