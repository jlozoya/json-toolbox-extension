chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "open-json-toolbox",
    title: "Open JSON Toolbox",
    contexts: ["selection", "page"],
  })
})

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "open-json-toolbox") {
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

// Chrome does not inject declarative content scripts into application/json pages.
// We detect JSON responses via webRequest headers and inject content.js manually.
chrome.webRequest.onHeadersReceived.addListener(
  (details): chrome.webRequest.BlockingResponse | undefined => {
    if (details.frameId !== 0) return undefined // top-level frame only

    const ct = details.responseHeaders
      ?.find((h) => h.name.toLowerCase() === "content-type")
      ?.value ?? ""

    if (!ct.toLowerCase().includes("json")) return undefined

    // Wait for the document to be ready, then inject
    chrome.tabs.get(details.tabId, () => {
      if (chrome.runtime.lastError) return

      const inject = () => {
        void chrome.scripting
          .executeScript({
            target: { tabId: details.tabId, allFrames: false },
            files: ["content.js"],
          })
          .catch(() => {
            // Ignore: tab may have navigated away or be a restricted page
          })
      }

      // Give the browser time to create the document
      setTimeout(inject, 50)
    })
  },
  { urls: ["http://*/*", "https://*/*"] },
  ["responseHeaders"],
)
