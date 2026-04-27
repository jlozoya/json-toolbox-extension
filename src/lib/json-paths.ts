export function extractJsonPaths(value: unknown, basePath = ""): string[] {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return basePath ? [`${basePath}[]`] : ["[]"]
    }

    return value.flatMap((item, index) =>
      extractJsonPaths(item, `${basePath}[${index}]`),
    )
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)

    if (entries.length === 0) {
      return basePath ? [basePath] : []
    }

    return entries.flatMap(([key, childValue]) => {
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)
        ? key
        : JSON.stringify(key)

      const nextPath = basePath
        ? safeKey.startsWith('"')
          ? `${basePath}[${safeKey}]`
          : `${basePath}.${safeKey}`
        : safeKey

      return extractJsonPaths(childValue, nextPath)
    })
  }

  return basePath ? [basePath] : []
}