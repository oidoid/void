export function TestElement(): Element {
  const target = new EventTarget()
  return Object.assign(target, {
    ownerDocument: target,
    setPointerCapture() {}
  }) as unknown as Element
}
