const openJsonToolboxMenuId = "open-json-toolbox"
const editorPayloadPrefix = "jsonToolboxEditorPayload:"

type EditorPayloadItem = {
  id: string
  text: string
  createdAt: string
}

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: openJsonToolboxMenuId,
      title: "Open JSON Toolbox",
      contexts: ["selection", "page"],
    })
  })
}

function getSessionStorageArea(): chrome.storage.StorageArea | null {
  return chrome.storage?.session ?? chrome.storage?.local ?? null
}

async function createEditorPayload(text: string): Promise<string | null> {
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
    [`${editorPayloadPrefix}${id}`]: payload,
  })

  return id
}

async function openEditor(text?: string) {
  const editorUrl = chrome.runtime.getURL("editor.html")

  if (!text) {
    await chrome.tabs.create({ url: editorUrl })
    return
  }

  const payloadId = await createEditorPayload(text)

  if (payloadId) {
    await chrome.tabs.create({
      url: `${editorUrl}?payloadId=${encodeURIComponent(payloadId)}`,
    })
    return
  }

  await chrome.tabs.create({
    url: `${editorUrl}?text=${encodeURIComponent(text)}`,
  })
}

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus()
})

chrome.runtime.onStartup.addListener(() => {
  createContextMenus()
})

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== openJsonToolboxMenuId) {
    return
  }

  void openEditor(info.selectionText)
})

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "open-editor" && typeof message.json === "string") {
    void openEditor(message.json)
  }
})

async function injectJsonViewer(tabId: number) {
  try {
    const [{ result: alreadyInjected }] = await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      func: () =>
        Boolean(
          document.getElementById("jtb-root") ||
          (globalThis as Record<string, unknown>).__JSON_TOOLBOX_CONTENT_SCRIPT_LOADED__,
        ),
    })

    if (alreadyInjected) {
      return
    }

    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: ["content.js"],
    })
  } catch {
    return
  }
}

chrome.webRequest.onHeadersReceived.addListener(
  (details): chrome.webRequest.BlockingResponse | undefined => {
    if (details.type !== "main_frame" || details.frameId !== 0 || details.tabId < 0) {
      return undefined
    }

    const contentType =
      details.responseHeaders
        ?.find((header) => header.name.toLowerCase() === "content-type")
        ?.value?.toLowerCase() ?? ""

    if (!contentType.includes("json")) {
      return undefined
    }

    setTimeout(() => {
      void injectJsonViewer(details.tabId)
    }, 50)

    return undefined
  },
  {
    urls: ["http://*/*", "https://*/*"],
  },
  ["responseHeaders"],
)
