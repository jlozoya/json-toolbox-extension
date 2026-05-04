const openJsonToolboxMenuId = "open-json-toolbox"

function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: openJsonToolboxMenuId,
      title: "Open JSON Toolbox",
      contexts: ["selection", "page"],
    })
  })
}

chrome.runtime.onInstalled.addListener(() => {
  createContextMenus()
})

chrome.runtime.onStartup.addListener(() => {
  createContextMenus()
})

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== openJsonToolboxMenuId) {
    return
  }

  const editorUrl = chrome.runtime.getURL("editor.html")

  await chrome.tabs.create({
    url: info.selectionText
      ? `${editorUrl}?text=${encodeURIComponent(info.selectionText)}`
      : editorUrl,
  })
})

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "open-editor" && typeof message.json === "string") {
    const editorUrl = chrome.runtime.getURL("editor.html")

    void chrome.tabs.create({
      url: `${editorUrl}?text=${encodeURIComponent(message.json)}`,
    })
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
