type ErrorPanelProps = {
  error: string | null
}

export function ErrorPanel({ error }: ErrorPanelProps) {
  if (!error) {
    return null
  }

  return <div className="error-panel">{error}</div>
}