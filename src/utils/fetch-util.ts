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

export function fetchImage(url: string): Promise<HTMLImageElement> {
  const img = new Image()
  const promise = loadImage(img)
  img.src = url
  return promise
}

export async function loadImage(
  img: HTMLImageElement
): Promise<HTMLImageElement> {
  const promise = new Promise<HTMLImageElement>((fulfil, reject) => {
    img.onload = () => fulfil(img)
    img.onerror = () => reject(Error(`image load error for ${img.src}`))
  })
  return img.complete ? img : await promise
}
