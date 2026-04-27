export type JsonFormatResult =
  | {
      ok: true
      value: unknown
      formatted: string
      minified: string
    }
  | {
      ok: false
      error: string
    }

export function formatJson(input: string, spaces = 2): JsonFormatResult {
  try {
    if (!input.trim()) {
      return { ok: false, error: "JSON input is empty." }
    }

    const value = JSON.parse(input)

    return {
      ok: true,
      value,
      formatted: JSON.stringify(value, null, spaces),
      minified: JSON.stringify(value),
    }
  } catch (err) {
    return {
      ok: false,
      error: buildErrorMessage(input, err instanceof Error ? err : new Error(String(err))),
    }
  }
}

function buildErrorMessage(input: string, err: Error): string {
  // V8: "Expected double-quoted property name in JSON at position 42"
  const posMatch = err.message.match(/at position (\d+)/)
  if (posMatch) {
    const pos = Math.min(parseInt(posMatch[1], 10), Math.max(0, input.length - 1))
    const before = input.slice(0, pos)
    const lines = before.split("\n")
    const line = lines.length
    const col = (lines[lines.length - 1]?.length ?? 0) + 1
    const base = err.message.replace(/ at position \d+/, "")
    return `${base}\n\nLine ${line}, column ${col}`
  }
  return err.message
}

export function sortJsonKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonKeys)
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortJsonKeys(value[key])
        return acc
      }, {})
  }

  return value
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
