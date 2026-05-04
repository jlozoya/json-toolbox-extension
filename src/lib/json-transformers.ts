export type JsonTransformKind =
  | "xml"
  | "xaml"
  | "csv"
  | "base64Encode"
  | "base64Decode"
  | "urlEncode"
  | "urlDecode"

export type JsonTransformOption = {
  value: JsonTransformKind
  label: string
  description: string
  requiresJson: boolean
}

export const JSON_TRANSFORM_OPTIONS: JsonTransformOption[] = [
  {
    value: "xml",
    label: "JSON to XML",
    description: "Convert JSON objects and arrays into readable XML.",
    requiresJson: true,
  },
  {
    value: "xaml",
    label: "JSON to XAML-like XML",
    description: "Generate a XAML-friendly XML representation.",
    requiresJson: true,
  },
  {
    value: "csv",
    label: "JSON to CSV",
    description: "Convert arrays of objects into CSV rows.",
    requiresJson: true,
  },
  {
    value: "base64Encode",
    label: "Encode Base64",
    description: "Encode the current text as Base64.",
    requiresJson: false,
  },
  {
    value: "base64Decode",
    label: "Decode Base64",
    description: "Decode Base64 text back to UTF-8.",
    requiresJson: false,
  },
  {
    value: "urlEncode",
    label: "URL encode",
    description: "Encode the current text for URLs.",
    requiresJson: false,
  },
  {
    value: "urlDecode",
    label: "URL decode",
    description: "Decode URL-encoded text.",
    requiresJson: false,
  },
]

export function transformJsonValue(
  kind: JsonTransformKind,
  value: unknown,
  rawInput: string,
  spaces = 2,
): string {
  switch (kind) {
    case "xml":
      return jsonToXml(value, "root", spaces)
    case "xaml":
      return jsonToXaml(value, spaces)
    case "csv":
      return jsonToCsv(value)
    case "base64Encode":
      return encodeBase64(rawInput)
    case "base64Decode":
      return decodeBase64(rawInput)
    case "urlEncode":
      return encodeURIComponent(rawInput)
    case "urlDecode":
      return decodeURIComponent(rawInput)
    default:
      return JSON.stringify(value, null, spaces)
  }
}

export function transformRawText(kind: JsonTransformKind, rawInput: string): string {
  switch (kind) {
    case "base64Encode":
      return encodeBase64(rawInput)
    case "base64Decode":
      return decodeBase64(rawInput)
    case "urlEncode":
      return encodeURIComponent(rawInput)
    case "urlDecode":
      return decodeURIComponent(rawInput)
    default:
      return rawInput
  }
}

export function transformRequiresJson(kind: JsonTransformKind) {
  return (
    JSON_TRANSFORM_OPTIONS.find((option) => option.value === kind)?.requiresJson ?? true
  )
}

function jsonToXml(value: unknown, rootName = "root", spaces = 2): string {
  const root = sanitizeXmlName(rootName)
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlNode(root, value, 0, spaces)}`
}

function xmlNode(name: string, value: unknown, depth: number, spaces: number): string {
  const indent = " ".repeat(depth * spaces)
  const childIndent = " ".repeat((depth + 1) * spaces)
  const tag = sanitizeXmlName(name)

  if (value === null) {
    return `${indent}<${tag} />`
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${indent}<${tag} />`
    }

    const children = value
      .map((item) => xmlNode("item", item, depth + 1, spaces))
      .join("\n")

    return `${indent}<${tag}>\n${children}\n${indent}</${tag}>`
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)

    if (entries.length === 0) {
      return `${indent}<${tag} />`
    }

    const children = entries
      .map(([key, childValue]) => {
        const safeKey = sanitizeXmlName(key)
        const keyAttribute =
          safeKey === key ? "" : ` originalKey="${escapeXmlAttribute(key)}"`

        return xmlNodeWithAttributes(safeKey, keyAttribute, childValue, depth + 1, spaces)
      })
      .join("\n")

    return `${indent}<${tag}>\n${children}\n${indent}</${tag}>`
  }

  return `${indent}<${tag}>${escapeXmlText(String(value))}</${tag}>`
}

function xmlNodeWithAttributes(
  name: string,
  attributes: string,
  value: unknown,
  depth: number,
  spaces: number,
): string {
  const indent = " ".repeat(depth * spaces)
  const tag = sanitizeXmlName(name)

  if (value === null) {
    return `${indent}<${tag}${attributes} />`
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${indent}<${tag}${attributes} />`
    }

    const children = value
      .map((item) => xmlNode("item", item, depth + 1, spaces))
      .join("\n")
    return `${indent}<${tag}${attributes}>\n${children}\n${indent}</${tag}>`
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)

    if (entries.length === 0) {
      return `${indent}<${tag}${attributes} />`
    }

    const children = entries
      .map(([key, childValue]) => {
        const safeKey = sanitizeXmlName(key)
        const keyAttribute =
          safeKey === key ? "" : ` originalKey="${escapeXmlAttribute(key)}"`

        return xmlNodeWithAttributes(safeKey, keyAttribute, childValue, depth + 1, spaces)
      })
      .join("\n")

    return `${indent}<${tag}${attributes}>\n${children}\n${indent}</${tag}>`
  }

  return `${indent}<${tag}${attributes}>${escapeXmlText(String(value))}</${tag}>`
}

function jsonToXaml(value: unknown, spaces = 2): string {
  return [
    `<ResourceDictionary xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"`,
    `                    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">`,
    xamlNode("Root", value, 1, spaces),
    `</ResourceDictionary>`,
  ].join("\n")
}

function xamlNode(name: string, value: unknown, depth: number, spaces: number): string {
  const indent = " ".repeat(depth * spaces)
  const key = sanitizeXamlKey(name)

  if (value === null) {
    return `${indent}<x:Null x:Key="${escapeXmlAttribute(key)}" />`
  }

  if (Array.isArray(value)) {
    const children = value
      .map((item, index) => xamlNode(`Item${index + 1}`, item, depth + 1, spaces))
      .join("\n")

    return `${indent}<x:Array x:Key="${escapeXmlAttribute(key)}" Type="{x:Type x:Object}">\n${children}\n${indent}</x:Array>`
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
    const children = entries
      .map(([childKey, childValue]) => xamlNode(childKey, childValue, depth + 1, spaces))
      .join("\n")

    return `${indent}<ObjectDataProvider x:Key="${escapeXmlAttribute(key)}">\n${children}\n${indent}</ObjectDataProvider>`
  }

  if (typeof value === "number") {
    return `${indent}<sys:Double x:Key="${escapeXmlAttribute(key)}">${value}</sys:Double>`
  }

  if (typeof value === "boolean") {
    return `${indent}<sys:Boolean x:Key="${escapeXmlAttribute(key)}">${value}</sys:Boolean>`
  }

  return `${indent}<x:String x:Key="${escapeXmlAttribute(key)}">${escapeXmlText(String(value))}</x:String>`
}

function jsonToCsv(value: unknown): string {
  const rows = normalizeRows(value)

  if (rows.length === 0) {
    return ""
  }

  const flattenedRows = rows.map((row) => flattenObject(row))
  const headers = Array.from(
    flattenedRows.reduce<Set<string>>((acc, row) => {
      Object.keys(row).forEach((key) => acc.add(key))
      return acc
    }, new Set<string>()),
  )

  return [
    headers.map(escapeCsvCell).join(","),
    ...flattenedRows.map((row) =>
      headers.map((header) => escapeCsvCell(row[header] ?? "")).join(","),
    ),
  ].join("\n")
}

function normalizeRows(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      if (item !== null && typeof item === "object" && !Array.isArray(item)) {
        return item as Record<string, unknown>
      }

      return {
        index,
        value: item,
      }
    })
  }

  if (value !== null && typeof value === "object") {
    return [value as Record<string, unknown>]
  }

  return [
    {
      value,
    },
  ]
}

function flattenObject(
  value: Record<string, unknown>,
  prefix = "",
  output: Record<string, string> = {},
): Record<string, string> {
  for (const [key, childValue] of Object.entries(value)) {
    const nextKey = prefix ? `${prefix}.${key}` : key

    if (
      childValue !== null &&
      typeof childValue === "object" &&
      !Array.isArray(childValue)
    ) {
      flattenObject(childValue as Record<string, unknown>, nextKey, output)
      continue
    }

    output[nextKey] =
      Array.isArray(childValue) || (childValue !== null && typeof childValue === "object")
        ? JSON.stringify(childValue)
        : childValue === null || childValue === undefined
          ? ""
          : String(childValue)
  }

  return output
}

function encodeBase64(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ""

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return btoa(binary)
}

function decodeBase64(value: string) {
  const binary = atob(value.trim())
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

  return new TextDecoder().decode(bytes)
}

function escapeCsvCell(value: string) {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}

function escapeXmlText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function escapeXmlAttribute(value: string) {
  return escapeXmlText(value).replace(/"/g, "&quot;")
}

function sanitizeXmlName(value: string) {
  const cleaned = value
    .trim()
    .replace(/[^a-zA-Z0-9_.-]/g, "_")
    .replace(/^[^a-zA-Z_]+/, "")

  return cleaned || "item"
}

function sanitizeXamlKey(value: string) {
  return value.trim().replace(/\s+/g, "_") || "Item"
}
