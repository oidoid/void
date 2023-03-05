import { Aseprite, FilmByID } from '@/atlas-pack'
import { Cam, ECS, Input, InstanceBuffer, RendererStateMachine } from '@/void'

export interface RunState<
  T,
  FilmID extends Aseprite.FileTag = Aseprite.FileTag,
> {
  readonly ecs: ECS<T>
  readonly filmByID: FilmByID<FilmID>
  readonly input: Readonly<Input>
  /** The running age in milliseconds. */
  readonly time: number
  /** The exact duration in milliseconds to apply on a given update step. */
  readonly tick: number
  readonly cam: Readonly<Cam>
  readonly instanceBuffer: InstanceBuffer
  readonly rendererStateMachine: RendererStateMachine
  pickHandled?: boolean
  random(): number
}
