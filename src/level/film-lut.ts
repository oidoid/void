import { Film } from '@/atlas-pack'

export interface FilmLUT {
  readonly filmByID: Readonly<{ [id: string]: Film }>
  readonly layerByID: Readonly<{ [id: string]: number }>
}
