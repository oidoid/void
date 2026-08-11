import {idbGet, idbOpen, idbPut} from './idb.ts'

export type Tmp = {
  config: FileSystemFileHandle | undefined
  level: FileSystemFileHandle | undefined
}

const databaseName: string = 'void' // to-do: game specific.
const tmpDatabaseStore: string = 'tmp'
const version: 1 = 1

export async function saveTmp(tmp: Tmp): Promise<void> {
  const db = await idbOpen(databaseName, tmpDatabaseStore, version)
  await Promise.all([
    idbPut(db, tmpDatabaseStore, 'config' satisfies keyof Tmp, tmp.config),
    idbPut(db, tmpDatabaseStore, 'level' satisfies keyof Tmp, tmp.level)
  ])
}

export async function loadTmp(): Promise<Tmp> {
  const db = await idbOpen(databaseName, tmpDatabaseStore, version)

  const [config, level] = await Promise.all([
    idbGet<FileSystemFileHandle>(
      db,
      tmpDatabaseStore,
      'config' satisfies keyof Tmp
    ),
    idbGet<FileSystemFileHandle>(
      db,
      tmpDatabaseStore,
      'level' satisfies keyof Tmp
    )
  ])
  return {config, level}
}
