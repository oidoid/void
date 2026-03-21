import { WASIHost } from "./wasi-host";
import type { WasmExports } from "./wasm-exports";
import type { WasmAPI } from "./wasm-api";

// to-do: use Wasm import.
export async function load(wasmURL: string): Promise<WasmAPI> {
  const wasi = new WASIHost();
  const result = await WebAssembly.instantiateStreaming(fetch(wasmURL), {
    wasi_snapshot_preview1: wasi,
  });
  const exports = result.instance.exports as WasmExports;
  wasi.link(exports.memory);
  exports._start();
  return exports;
}
