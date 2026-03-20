export async function fetchAudio(url: string): Promise<ArrayBuffer> {
  const rsp = await fetch(url, {headers: {accept: 'audio/mpeg'}})
  if (!rsp.ok)
    throw Error(`fetch error ${rsp.status}: ${rsp.statusText} for ${url}`)
  const type = rsp.headers.get('Content-Type')
  // to-do: ogg
  if (!type?.startsWith('audio/mpeg'))
    throw Error(`bad fetch response type ${type} for ${url}`)
  return await rsp.arrayBuffer()
}

export async function fetchImage(uri: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = uri
  await img.decode()
  return img
}
