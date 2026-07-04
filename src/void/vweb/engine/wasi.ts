/**
 * WASI preview1 host for Wasm modules. see
 * https://github.com/tinygo-org/tinygo/blob/release/targets/wasm_exec.js.
 */
export class WASI {
  [k: string]: WebAssembly.ImportValue
  #decoder: TextDecoder = new TextDecoder()
  #mem!: WebAssembly.Memory

  args_get = (argv: number, argvBuf: number): number => {
    const view = new DataView(this.#mem.buffer)
    view.setUint32(argv, argvBuf, true)
    return 0
  }

  args_sizes_get = (argc: number, argvBufSize: number): number => {
    const view = new DataView(this.#mem.buffer)
    view.setUint32(argc, 0, true)
    view.setUint32(argvBufSize, 0, true)
    return 0
  }

  clock_time_get = (
    _clockID: number,
    _precision: bigint,
    result: number
  ): number => {
    const now = BigInt(
      Math.floor((performance.timeOrigin + performance.now()) * 1e6)
    )
    new DataView(this.#mem.buffer).setBigUint64(result, now, true)
    return 0
  }

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
      const ptr = u32[(iovs >>> 2) + i * 2]!
      const len = u32[(iovs >>> 2) + i * 2 + 1]!
      text += this.#decoder.decode(u8.subarray(ptr, ptr + len), {
        stream: true
      })
      written += len
    }
    text += this.#decoder.decode()
    ;(fd === 2 ? console.error : console.log)(text)
    u32[nwritten >>> 2] = written
    return 0
  }

  link(mem: WebAssembly.Memory): void {
    this.#mem = mem
  }

  proc_exit = (code: number): void => {
    if (code !== 0) throw Error(`WASI exit ${code}`)
  }

  random_get = (ptr: number, len: number): number => {
    crypto.getRandomValues(new Uint8Array(this.#mem.buffer, ptr, len))
    return 0
  }
}
