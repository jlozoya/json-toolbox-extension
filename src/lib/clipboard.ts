export type ClipboardResult =
  | {
      ok: true
    }
  | {
      ok: false
      error: string
    }

export async function copyToClipboard(value: string): Promise<ClipboardResult> {
  if (!value) {
    return {
      ok: false,
      error: "There is no content to copy.",
    }
  }

  try {
    await navigator.clipboard.writeText(value)
    return { ok: true }
  } catch {
    return fallbackCopyToClipboard(value)
  }
}

function fallbackCopyToClipboard(value: string): ClipboardResult {
  try {
    const textarea = document.createElement("textarea")

    textarea.value = value
    textarea.setAttribute("readonly", "true")
    textarea.style.position = "fixed"
    textarea.style.top = "-1000px"
    textarea.style.left = "-1000px"
    textarea.style.opacity = "0"

    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()

    const copied = document.execCommand("copy")

    textarea.remove()

    if (!copied) {
      return {
        ok: false,
        error: "Copy failed. Select the output and copy it manually.",
      }
    }

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : "Copy failed. Select the output and copy it manually.",
    }
  }
}
