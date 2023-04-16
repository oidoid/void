import { AsepriteFileTag, Atlas } from '@/atlas-pack'
import { ShaderLayout } from '@/void'

export interface Assets<FilmID extends AsepriteFileTag = AsepriteFileTag> {
  readonly spritesheet: Readonly<HTMLImageElement>
  readonly atlas: Readonly<Atlas<FilmID>>
  readonly shaderLayout: ShaderLayout
}
