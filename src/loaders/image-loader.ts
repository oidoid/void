export namespace ImageLoader {
  export function load(source: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = () => reject(image)
      image.src = source
    })
  }
}
