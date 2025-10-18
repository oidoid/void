import {JSDOM} from 'jsdom'

export async function parseHTML(filename: string): Promise<Document> {
  try {
    return (await JSDOM.fromFile(filename)).window.document
  } catch (err) {
    throw Error(`HTML ${filename} unparsable`, {cause: err})
  }
}
