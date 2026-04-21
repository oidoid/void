export function initBody(): void {
  document.body.style.margin = '0'
  // fill the screen except for UI chrome.
  document.body.style.width = '100dvw'
  document.body.style.height = '100dvh'
  document.body.style.overflow = 'hidden'
}
