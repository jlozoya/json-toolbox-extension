import type { TabValue } from "../components/Tabs"

export type JsonToolboxSettings = {
  indentSize: 2 | 4
  defaultView: TabValue
}

export type JsonHistoryItem = {
  id: string
  input: string
  createdAt: string
}

type StoredJsonToolboxSettings = Partial<{
  indentSize: unknown
  defaultView: unknown
}>

const SETTINGS_KEY = "jsonToolboxSettings"
const HISTORY_KEY = "jsonToolboxHistory"

const defaultSettings: JsonToolboxSettings = {
  indentSize: 2,
  defaultView: "format",
}

function hasChromeStorage() {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.local)
}

function normalizeDefaultView(value: unknown): TabValue {
  if (
    value === "format" ||
    value === "tree" ||
    value === "transform" ||
    value === "types" ||
    value === "paths" ||
    value === "history"
  ) {
    return value
  }

  return defaultSettings.defaultView
}

function normalizeIndentSize(value: unknown): 2 | 4 {
  return value === 4 ? 4 : 2
}

function normalizeStoredSettings(value: unknown): JsonToolboxSettings {
  const stored =
    value !== null && typeof value === "object"
      ? (value as StoredJsonToolboxSettings)
      : {}

  return {
    indentSize: normalizeIndentSize(stored.indentSize),
    defaultView: normalizeDefaultView(stored.defaultView),
  }
}

export async function getSettings(): Promise<JsonToolboxSettings> {
  if (!hasChromeStorage()) {
    return defaultSettings
  }

  const result = await chrome.storage.local.get(SETTINGS_KEY)

  return {
    ...defaultSettings,
    ...normalizeStoredSettings(result[SETTINGS_KEY]),
  }
}

export async function saveSettings(settings: JsonToolboxSettings) {
  if (!hasChromeStorage()) {
    return
  }

  await chrome.storage.local.set({
    [SETTINGS_KEY]: settings,
  })
}

export async function getHistory(): Promise<JsonHistoryItem[]> {
  if (!hasChromeStorage()) {
    return []
  }

  const result = await chrome.storage.local.get(HISTORY_KEY)
  const value = result[HISTORY_KEY]

  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(isJsonHistoryItem)
}

export async function addHistoryItem(input: string) {
  if (!hasChromeStorage() || !input.trim()) {
    return
  }

  const currentHistory = await getHistory()

  const nextHistory: JsonHistoryItem[] = [
    {
      id: crypto.randomUUID(),
      input,
      createdAt: new Date().toISOString(),
    },
    ...currentHistory.filter((item) => item.input !== input),
  ].slice(0, 20)

  await chrome.storage.local.set({
    [HISTORY_KEY]: nextHistory,
  })
}

export async function clearHistory() {
  if (!hasChromeStorage()) {
    return
  }

  await chrome.storage.local.set({
    [HISTORY_KEY]: [],
  })
}

function isJsonHistoryItem(value: unknown): value is JsonHistoryItem {
  if (value === null || typeof value !== "object") {
    return false
  }

  const item = value as Partial<JsonHistoryItem>

  return (
    typeof item.id === "string" &&
    typeof item.input === "string" &&
    typeof item.createdAt === "string"
  )
}
