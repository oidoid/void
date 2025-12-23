import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {loadJSON, saveJSON} from './local-storage.ts'

test('saveJSON() / loadJSON()', () => {
  using _storage = new StorageMock(new MemStorage())

  const v = {a: 1, b: true, c: 'c'}
  saveJSON('v', v)

  assert(loadJSON('v'), v)

  saveJSON('v', undefined)
  assert(loadJSON('v'), undefined)
})

class StorageMock {
  readonly #storage: Storage
  constructor(storage: Storage) {
    this.#storage = globalThis.localStorage
    globalThis.localStorage = storage
  }

  [Symbol.dispose]() {
    globalThis.localStorage = this.#storage
  }
}

class MemStorage implements Storage {
  #kv: {[k: string]: string} = {}

  clear(): void {
    this.#kv = {}
  }
  getItem(k: string): string | null {
    return this.#kv[k] ?? null
  }
  key(i: number): string | null {
    return Object.keys(this.#kv)[i] ?? null
  }
  get length(): number {
    return Object.keys(this.#kv).length
  }
  removeItem(k: string): void {
    delete this.#kv[k]
  }
  setItem(k: string, v: string): void {
    this.#kv[k] = v
  }
}
