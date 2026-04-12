/**
 * WASI preview1 host for Wasm modules. see
 * https://github.com/tinygo-org/tinygo/blob/release/targets/wasm_exec.js.
 */
export class WASIHost {
  [k: string]: WebAssembly.ImportValue
  #decoder: TextDecoder = new TextDecoder()
  #mem!: WebAssembly.Memory

  /** writes file descriptor stdout / err to `console.log()` / `error()`. */
  fd_write = (
    /** file descriptor (1 = stdout, 2 = stderr). */
    fd: number,
    /** byte offset of the iovec array in Wasm memory. */
    iovs: number,
    /** number of iovec entries. */
    iovsLen: number,
    /** byte offset where the total bytes written is stored. */
    nwritten: number
  ): number => {
    const buf = this.#mem.buffer
    const u8 = new Uint8Array(buf)
    const u32 = new Uint32Array(buf)
    let text = ''
    let written = 0
    for (let i = 0; i < iovsLen; i++) {
      const ptr = u32[(iovs >> 2) + i * 2]!
      const len = u32[(iovs >> 2) + i * 2 + 1]!
      text += this.#decoder.decode(u8.subarray(ptr, ptr + len), {
        stream: true
      })
      written += len
    }
    text += this.#decoder.decode()
    ;(fd === 2 ? console.error : console.log)(text)
    u32[nwritten >> 2] = written
    return 0
  }

  link(mem: WebAssembly.Memory): void {
    this.#mem = mem
  }

  /** process exit. */
  proc_exit = (_code: number): void => {}

  random_get = (ptr: number, len: number): number => {
    crypto.getRandomValues(new Uint8Array(this.#mem.buffer, ptr, len))
    return 0
  }
}
