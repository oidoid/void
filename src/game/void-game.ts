import { AsepriteFileTag, FilmByID } from '@/atlas-pack'
import { Box, XY } from '@/ooz'
import {
  Assets,
  BitmapBuffer,
  Cam,
  ECS,
  Game,
  Input,
  RendererStateMachine,
  VoidEnt,
} from '@/void'

export abstract class VoidGame<
  Ent extends VoidEnt,
  FilmID extends AsepriteFileTag,
> implements Game<Ent, FilmID> {
  readonly cam: Cam
  readonly ecs: ECS<Ent>
  readonly filmByID: FilmByID<FilmID>
  readonly input: Input
  pickHandled = false
  readonly renderer: RendererStateMachine

  readonly #bitmaps: BitmapBuffer
  readonly #random: () => number
  #time = 0
  #tick = 1

  constructor(
    assets: Assets<FilmID>,
    canvas: HTMLCanvasElement,
    minViewport: XY,
    random: () => number,
    window: Window,
    bounds: Readonly<Box>,
    cellWH: Readonly<XY>,
  ) {
    this.ecs = new ECS(bounds, cellWH)
    this.cam = new Cam(minViewport, window)
    this.input = new Input(
      this.cam,
      window.navigator,
      window,
      window.document,
      canvas,
      window,
    )
    this.filmByID = assets.atlas.filmByID
    this.#bitmaps = new BitmapBuffer(assets.shaderLayout)
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

    let index = 0
    for (const ent of this.ecs.querySpriteEnts(this.cam.viewport)) {
      for (const sprite of ent.sprites) {
        if (!sprite.bounds.intersects(this.cam.viewport)) continue
        this.#bitmaps.set(index, sprite, this.time)
        index++
      }
    }

    this.renderer.render(this.time, this.cam, this.#bitmaps)

    this.onFrame()

    this.input.postupdate(this.tick)
  }
}
