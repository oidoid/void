export async function idbDelete(
  db: IDBDatabase,
  store: string,
  k: string
): Promise<void> {
  const tx = db.transaction(store, 'readwrite')
  tx.objectStore(store).delete(k)
  return new Promise((fulfil, reject) => {
    tx.oncomplete = () => fulfil()
    tx.onerror = () => reject(tx.error)
  })
}

export async function idbGet<V>(
  db: IDBDatabase,
  store: string,
  k: string
): Promise<V | undefined> {
  const tx = db.transaction(store, 'readonly')
  return new Promise((fulfil, reject) => {
    const req = tx.objectStore(store).get(k)
    req.onsuccess = () => fulfil(req.result)
    req.onerror = () => reject(req.error)
  })
}

export function idbOpen(
  db: string,
  store: string,
  version: number
): Promise<IDBDatabase> {
  return new Promise((fulfil, reject) => {
    const req = indexedDB.open(db, version)
    req.onupgradeneeded = () => req.result.createObjectStore(store)
    req.onsuccess = () => fulfil(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** v can be anything structure cloneable. */
export async function idbPut<V>(
  db: IDBDatabase,
  store: string,
  k: string,
  v: V
): Promise<void> {
  const tx = db.transaction(store, 'readwrite')
  tx.objectStore(store).put(v, k)
  return new Promise((fulfil, reject) => {
    tx.oncomplete = () => fulfil()
    tx.onerror = () => reject(tx.error)
  })
}
