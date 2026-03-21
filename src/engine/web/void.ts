import { WASIHost } from "./wasi-host";
import type { VoidAPI, WASMExports } from "./wasm-exports";

// to-do: use WASM import.
export async function load(wasmURL: string): Promise<VoidAPI> {
  const wasi = new WASIHost();
  const result = await WebAssembly.instantiateStreaming(fetch(wasmURL), {
    wasi_snapshot_preview1: wasi,
  });
  const exports = result.instance.exports as WASMExports;
  wasi.link(exports.memory);
  exports._start();
  return exports;
}
