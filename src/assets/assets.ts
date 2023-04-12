import { AsepriteFileTag, AtlasMeta } from '@/atlas-pack'
import { ShaderLayout } from '@/void'

export interface Assets<FilmID extends AsepriteFileTag = AsepriteFileTag> {
  readonly atlas: Readonly<HTMLImageElement>
  readonly atlasMeta: Readonly<AtlasMeta<FilmID>>
  readonly shaderLayout: ShaderLayout
}
