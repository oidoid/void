export class SecureContextMock {
  readonly #isSecureContext = globalThis.isSecureContext

  set secure(secure: boolean) {
    globalThis.isSecureContext = secure
  }

  [Symbol.dispose](): void {
    globalThis.isSecureContext = this.#isSecureContext
  }
}
