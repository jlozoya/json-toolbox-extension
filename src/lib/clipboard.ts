export async function copyToClipboard(value: string) {
  if (!value) {
    return
  }

  await navigator.clipboard.writeText(value)
}
