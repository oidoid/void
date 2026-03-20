import * as V from '../../engine/index.ts'

/**
 * returns the cached handle if read permission is granted, else shows a file
 * picker.
 */
export async function pickOrRestore(
  cached: FileSystemFileHandle | undefined,
  opts: Readonly<ShowOpenFilePickerOptions>
): Promise<FileSystemFileHandle> {
  if (cached && (await cached.requestPermission({mode: 'read'})) === 'granted')
    return cached
  const pick = await showOpenFilePicker(opts)
  return pick[0]!
}

/** loads an image from a file handle via a temporary object URL. */
export async function loadImgFromHandle(
  handle: FileSystemFileHandle
): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(await handle.getFile())
  const img = await V.fetchImage(url)
  URL.revokeObjectURL(url)
  return img
}

/** parses a game config JSON file and returns the tileset metadata. */
export async function loadConfigData(
  handle: FileSystemFileHandle
): Promise<V.Tileset> {
  const json = JSON.parse(await (await handle.getFile()).text())
  return json.tileset as V.Tileset
}

/**
 * parses a level JSON file and writes tileset / levelTiles / tile onto the
 * loader.
 */
export async function loadLevelData(
  handle: FileSystemFileHandle,
  loader: V.Loader
): Promise<void> {
  const json = JSON.parse(await (await handle.getFile()).text())
  loader.levelTiles = json.level
  loader.tile = 0
}
