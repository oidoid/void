import { Aseprite, FilmByID } from '@/atlas-pack'
import { U16XY } from '@/ooz'
import { Assets, Cam, ECS, Game, Input, RendererStateMachine } from '@/void'

export abstract class VoidGame<Ent, FilmID extends Aseprite.FileTag>
  implements Game<Ent, FilmID> {
  readonly cam: Cam
  readonly ecs: ECS<Ent> = new ECS()
  readonly filmByID: FilmByID<FilmID>
  readonly input: Input
  pickHandled: boolean = false
  readonly renderer: RendererStateMachine

  readonly #random: () => number
  #time: number = 0
  #tick: number = 1

  constructor(
    assets: Assets<FilmID>,
    canvas: HTMLCanvasElement,
    minViewport: U16XY,
    random: () => number,
    window: Window,
  ) {
    this.cam = new Cam(minViewport, window)
    this.input = new Input(
      this.cam,
      window.navigator,
      window,
      window.document,
      canvas,
      window,
    )
    this.filmByID = assets.atlasMeta.filmByID
    this.renderer = new RendererStateMachine({
      assets,
      window,
      canvas,
      onFrame: (delta) => this.#onFrame(delta),
      onPause: () => this.onPause(),
    })
    this.#random = random
  }

  onFrame(): void {}

  onPause(): void {
    this.input.reset()
  }

  random(): number {
    return this.#random()
  }

  start(): void {
    this.input.register('add')
    this.renderer.start()
  }

  stop(): void {
    this.input.register('remove')
    this.renderer.stop()
  }

  get tick(): number {
    return this.#tick
  }

  get time(): number {
    return this.#time
  }

  #onFrame(delta: number): void {
    this.#tick = delta
    this.#time += delta
    this.pickHandled = false

    this.input.preupdate()

    this.cam.resize()

    this.ecs.run(this)

    this.onFrame()

    this.input.postupdate(this.tick)
  }
}
