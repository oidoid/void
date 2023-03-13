import { Aseprite, AtlasMeta } from '@/atlas-pack'
import { ShaderLayout } from '@/void'

export interface Assets<FilmID extends Aseprite.FileTag = Aseprite.FileTag> {
  readonly atlas: Readonly<HTMLImageElement>
  readonly atlasMeta: Readonly<AtlasMeta<FilmID>>
  readonly shaderLayout: ShaderLayout
}
