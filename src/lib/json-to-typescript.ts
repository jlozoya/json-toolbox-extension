type TypeOptions = {
  rootName?: string
}

export function jsonToTypeScript(value: unknown, options: TypeOptions = {}) {
  const rootName = sanitizeTypeName(options.rootName ?? "Root")
  const declarations: string[] = []
  const rootType = inferType(value, rootName, declarations)

  if (rootType !== rootName) {
    declarations.push(`export type ${rootName} = ${rootType}`)
  }

  return declarations.join("\n\n")
}

function inferType(value: unknown, typeName: string, declarations: string[]): string {
  if (value === null) {
    return "null"
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "unknown[]"
    }

    const childTypes = unique(value.map((item) => inferType(item, typeName, declarations)))
    const arrayType = childTypes.length === 1 ? childTypes[0] : `(${childTypes.join(" | ")})`

    return `${arrayType}[]`
  }

  switch (typeof value) {
    case "string":
      return "string"
    case "number":
      return "number"
    case "boolean":
      return "boolean"
    case "object": {
      const objectValue = value as Record<string, unknown>
      const entries = Object.entries(objectValue)

      if (entries.length === 0) {
        return "Record<string, unknown>"
      }

      const interfaceName = sanitizeTypeName(typeName)
      const lines = entries.map(([key, childValue]) => {
        const propertyName = isValidIdentifier(key) ? key : JSON.stringify(key)
        const childTypeName = sanitizeTypeName(`${interfaceName}_${key}`)
        const childType = inferType(childValue, childTypeName, declarations)

        return `  ${propertyName}: ${childType}`
      })

      const declaration = `export interface ${interfaceName} {\n${lines.join("\n")}\n}`

      if (!declarations.includes(declaration)) {
        declarations.unshift(declaration)
      }

      return interfaceName
    }
    default:
      return "unknown"
  }
}

function unique(values: string[]) {
  return Array.from(new Set(values))
}

function isValidIdentifier(value: string) {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(value)
}

function sanitizeTypeName(value: string) {
  const cleaned = value
    .replace(/[^a-zA-Z0-9_$]/g, "_")
    .replace(/^[^a-zA-Z_$]+/, "")

  if (!cleaned) {
    return "GeneratedType"
  }

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
}