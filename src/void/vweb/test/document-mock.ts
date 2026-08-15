export class DocumentMock extends EventTarget {
  readonly #document = globalThis.document

  constructor() {
    super()
    globalThis.document = this as unknown as Document
  }

  [Symbol.dispose](): void {
    globalThis.document = this.#document
  }
}
