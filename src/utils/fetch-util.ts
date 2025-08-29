export function fetchImage(url: string): Promise<HTMLImageElement> {
  return new Promise((fulfil, reject) => {
    const img = new Image()
    img.onload = () => fulfil(img)
    img.onerror = () => reject(Error(`image load failed for ${url}`))
    img.src = url
  })
}
