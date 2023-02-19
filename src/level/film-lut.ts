import { Film } from '@/atlas-pack'
import { U8 } from '@/ooz'

export interface FilmLUT {
  readonly filmByID: Readonly<{ [id: string]: Film }>
  readonly layerByID: Readonly<{ [id: string]: U8 }>
}
