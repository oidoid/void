import {test} from 'node:test'
import {assert} from '../../test/assert.ts'
import {idbDelete, idbGet, idbOpen, idbPut} from './idb.ts'

test('idbGet() / idbPut()', async () => {
  using _idb = new IDBMock()
  const db = await idbOpen('test-db', 'test-store', 1)

  await idbPut(db, 'test-store', 'key', {x: 1})
  const v = await idbGet<{x: number}>(db, 'test-store', 'key')
  assert(v, {x: 1})
})

test('idbGet() returns undefined for missing key', async () => {
  using _idb = new IDBMock()
  const db = await idbOpen('test-db', 'test-store', 1)

  const v = await idbGet(db, 'test-store', 'missing')
  assert(v, undefined)
})

test('idbDelete() removes a key', async () => {
  using _idb = new IDBMock()
  const db = await idbOpen('test-db', 'test-store', 1)

  await idbPut(db, 'test-store', 'key', 'value')
  await idbDelete(db, 'test-store', 'key')
  const v = await idbGet(db, 'test-store', 'key')
  assert(v, undefined)
})

class IDBMock {
  readonly #indexedDB: IDBFactory = globalThis.indexedDB

  constructor() {
    globalThis.indexedDB = new IDBFactoryMock() as unknown as IDBFactory
  }

  [Symbol.dispose](): void {
    globalThis.indexedDB = this.#indexedDB
  }
}

class IDBFactoryMock {
  readonly #databases: {[k: string]: IDBDatabaseMock} = {}

  open(name: string, _version?: number): IDBOpenDBRequest {
    let db = this.#databases[name]
    const isNew = db == null
    if (isNew) {
      db = new IDBDatabaseMock()
      this.#databases[name] = db
    }

    const req = new IDBOpenDBRequestMock(db!)
    queueMicrotask(() => {
      if (isNew)
        req.onupgradeneeded?.(
          new Event('upgradeneeded') as IDBVersionChangeEvent
        )
      req.onsuccess?.(new Event('success'))
    })
    return req as unknown as IDBOpenDBRequest
  }
}

class IDBOpenDBRequestMock {
  readonly result: IDBDatabaseMock
  onsuccess: ((ev: Event) => void) | undefined
  onerror: ((ev: Event) => void) | undefined
  onupgradeneeded: ((ev: IDBVersionChangeEvent) => void) | undefined

  constructor(db: IDBDatabaseMock) {
    this.result = db
  }
}

class IDBDatabaseMock {
  readonly #stores: {[k: string]: Map<string, unknown>} = {}

  createObjectStore(name: string): void {
    if (!(name in this.#stores)) this.#stores[name] = new Map()
  }

  transaction(store: string, _mode: IDBTransactionMode): IDBTransactionMock {
    if (!(store in this.#stores)) this.#stores[store] = new Map()
    return new IDBTransactionMock(this.#stores[store]!)
  }
}

class IDBTransactionMock {
  oncomplete: ((ev: Event) => void) | undefined
  onerror: ((ev: Event) => void) | undefined
  readonly #store: Map<IDBValidKey, unknown>

  constructor(store: Map<IDBValidKey, unknown>) {
    this.#store = store
  }

  objectStore(_name: string): IDBObjectStoreMock {
    return new IDBObjectStoreMock(this.#store, this)
  }
}

class IDBObjectStoreMock {
  readonly #store: Map<IDBValidKey, unknown>
  readonly #tx: IDBTransactionMock

  constructor(store: Map<IDBValidKey, unknown>, tx: IDBTransactionMock) {
    this.#store = store
    this.#tx = tx
  }

  put(v: unknown, k: IDBValidKey): void {
    this.#store.set(k, v)
    queueMicrotask(() => this.#tx.oncomplete?.(new Event('complete')))
  }

  get(k: IDBValidKey): IDBRequestMock {
    const result = this.#store.get(k)
    const req = new IDBRequestMock(result)
    queueMicrotask(() => req.onsuccess?.(new Event('success')))
    return req
  }

  delete(k: IDBValidKey): void {
    this.#store.delete(k)
    queueMicrotask(() => this.#tx.oncomplete?.(new Event('complete')))
  }
}

class IDBRequestMock {
  onsuccess: ((ev: Event) => void) | undefined
  onerror: ((ev: Event) => void) | undefined
  result: unknown

  constructor(result: unknown) {
    this.result = result
  }
}
