import fs from 'node:fs/promises'

export async function globAll(glob: string): Promise<string[]> {
  const filenames = []
  try {
    for await (const filename of fs.glob(glob)) filenames.push(filename)
  } catch (err) {
    throw Error(`glob \`${glob}\` unreadable`, {cause: err})
  }
  return filenames
}
