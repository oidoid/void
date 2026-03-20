import * as V from '../../engine/index.ts'

export type Tmp = {
  config: FileSystemFileHandle | undefined
  level: FileSystemFileHandle | undefined
  tileset: FileSystemFileHandle | undefined
}

const tvDatabaseName: string = 'tv'
const tmpDatabaseStore: string = 'tmp'
const version: 1 = 1

export async function saveTmp(tmp: Tmp): Promise<void> {
  const db = await V.idbOpen(tvDatabaseName, tmpDatabaseStore, version)
  await Promise.all([
    V.idbPut(db, tmpDatabaseStore, 'config' satisfies keyof Tmp, tmp.config),
    V.idbPut(db, tmpDatabaseStore, 'level' satisfies keyof Tmp, tmp.level),
    V.idbPut(db, tmpDatabaseStore, 'tileset' satisfies keyof Tmp, tmp.tileset)
  ])
}

export async function loadTmp(): Promise<Tmp> {
  const db = await V.idbOpen(tvDatabaseName, tmpDatabaseStore, version)

  const [config, level, tileset] = await Promise.all([
    V.idbGet<FileSystemFileHandle>(
      db,
      tmpDatabaseStore,
      'config' satisfies keyof Tmp
    ),
    V.idbGet<FileSystemFileHandle>(
      db,
      tmpDatabaseStore,
      'level' satisfies keyof Tmp
    ),
    V.idbGet<FileSystemFileHandle>(
      db,
      tmpDatabaseStore,
      'tileset' satisfies keyof Tmp
    )
  ])
  return {config, level, tileset}
}
