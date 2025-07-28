export function TestElement(): Element {
  return Object.assign(new EventTarget(), {
    setPointerCapture() {}
  }) as unknown as Element
}
