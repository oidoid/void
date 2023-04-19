import { AsepriteFileTag, FilmByID } from '@/atlas-pack'
import { Cam, ECS, Input, RendererStateMachine, SpriteEnt } from '@/void'

export interface Game<
  Ent extends SpriteEnt,
  in FilmID extends AsepriteFileTag = AsepriteFileTag,
> {
  // to-do: extend ECS and Input and RendererStateMachine.
  readonly cam: Readonly<Cam>
  readonly ecs: ECS<Ent>
  readonly filmByID: FilmByID<FilmID>
  readonly input: Readonly<Input>
  pickHandled?: boolean
  /** The running age in milliseconds. */
  readonly time: number
  /** The exact duration in milliseconds to apply on a given update step. */
  readonly tick: number
  readonly renderer: RendererStateMachine
  random(): number
}
