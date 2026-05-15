import type { TabValue } from "../components/Tabs"

export type JsonToolboxSettings = {
  indentSize: 2 | 4
  defaultView: TabValue
  saveHistory: boolean
}

export type JsonHistoryItem = {
  id: string
  input: string
  createdAt: string
}

type StoredJsonToolboxSettings = Partial<{
  indentSize: unknown
  defaultView: unknown
  saveHistory: unknown
}>

type EditorPayloadItem = {
  id: string
  text: string
  createdAt: string
}

const SETTINGS_KEY = "jsonToolboxSettings"
const HISTORY_KEY = "jsonToolboxHistory"
const EDITOR_PAYLOAD_PREFIX = "jsonToolboxEditorPayload:"
const MAX_HISTORY_ITEMS = 20

const defaultSettings: JsonToolboxSettings = {
  indentSize: 2,
  defaultView: "format",
  saveHistory: false,
}

function hasChromeStorage() {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.local)
}

function getSessionStorageArea(): chrome.storage.StorageArea | null {
  if (typeof chrome === "undefined") {
    return null
  }

  return chrome.storage?.session ?? chrome.storage?.local ?? null
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

function normalizeBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback
}

function normalizeStoredSettings(value: unknown): JsonToolboxSettings {
  const stored =
    value !== null && typeof value === "object"
      ? (value as StoredJsonToolboxSettings)
      : {}

  return {
    indentSize: normalizeIndentSize(stored.indentSize),
    defaultView: normalizeDefaultView(stored.defaultView),
    saveHistory: normalizeBoolean(stored.saveHistory, defaultSettings.saveHistory),
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

export async function addHistoryItem(input: string, enabled = true) {
  if (!enabled || !hasChromeStorage() || !input.trim()) {
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
  ].slice(0, MAX_HISTORY_ITEMS)

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

export async function storeEditorPayload(text: string): Promise<string | null> {
  const storageArea = getSessionStorageArea()

  if (!storageArea || !text) {
    return null
  }

  const id = crypto.randomUUID()
  const payload: EditorPayloadItem = {
    id,
    text,
    createdAt: new Date().toISOString(),
  }

  await storageArea.set({
    [`${EDITOR_PAYLOAD_PREFIX}${id}`]: payload,
  })

  return id
}

export async function getEditorPayload(id: string): Promise<string | null> {
  const storageArea = getSessionStorageArea()

  if (!storageArea || !id) {
    return null
  }

  const key = `${EDITOR_PAYLOAD_PREFIX}${id}`
  const result = await storageArea.get(key)
  const value = result[key]

  if (!isEditorPayloadItem(value)) {
    return null
  }

  return value.text
}

export async function removeEditorPayload(id: string) {
  const storageArea = getSessionStorageArea()

  if (!storageArea || !id) {
    return
  }

  await storageArea.remove(`${EDITOR_PAYLOAD_PREFIX}${id}`)
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

function isEditorPayloadItem(value: unknown): value is EditorPayloadItem {
  if (value === null || typeof value !== "object") {
    return false
  }

  const item = value as Partial<EditorPayloadItem>

  return (
    typeof item.id === "string" &&
    typeof item.text === "string" &&
    typeof item.createdAt === "string"
  )
}
