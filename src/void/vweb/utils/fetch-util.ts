export async function fetchAudio(url: string): Promise<ArrayBuffer> {
  const rsp = await fetch(url, {headers: {accept: 'audio/mpeg, audio/ogg'}})
  if (!rsp.ok)
    throw Error(`fetch error ${rsp.status}: ${rsp.statusText} for ${url}`)
  const type = rsp.headers.get('Content-Type')
  if (!type || !/^audio\/(?:mpeg|ogg)(?:\s*;|$)/i.test(type))
    throw Error(`bad fetch response type ${type} for ${url}`)
  return await rsp.arrayBuffer()
}

export async function fetchImage(uri: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = uri
  await img.decode()
  return img
}
