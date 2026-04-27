export type JsonToolboxSettings = {
  indentSize: 2 | 4
  defaultView: "format" | "tree" | "types" | "paths" | "history"
}

export type JsonHistoryItem = {
  id: string
  input: string
  createdAt: string
}

const SETTINGS_KEY = "jsonToolboxSettings"
const HISTORY_KEY = "jsonToolboxHistory"

const defaultSettings: JsonToolboxSettings = {
  indentSize: 2,
  defaultView: "format",
}

function hasChromeStorage() {
  return typeof chrome !== "undefined" && Boolean(chrome.storage?.local)
}

export async function getSettings(): Promise<JsonToolboxSettings> {
  if (!hasChromeStorage()) {
    return defaultSettings
  }

  const result = await chrome.storage.local.get(SETTINGS_KEY)

  return {
    ...defaultSettings,
    ...(result[SETTINGS_KEY] ?? {}),
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

  return Array.isArray(result[HISTORY_KEY]) ? result[HISTORY_KEY] : []
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