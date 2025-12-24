import * as V from '../index.ts'
import config from './assets/demo.game.json' with {type: 'json'}
import {ClockSys} from './ents/clock.ts'
import {RenderToggleSys} from './ents/render-toggle.ts'
import {TallySys} from './ents/tally.ts'
import levelJSON from './level/demo.level.jsonc' with {type: 'json'}
import {parseLevel} from './level/level-parser.ts'
import {renderDelayMillis} from './utils/render-delay-millis.ts'

export class Game extends V.Void {
  constructor() {
    super({
      config: config as V.GameConfig,
      preloadAtlas: document.querySelector<HTMLImageElement>('#preload-atlas'),
      poll: {
        delay: () => renderDelayMillis(new Date(), V.debug?.seconds),
        period: ((V.debug?.seconds ? 1 : 60) * 1000) as V.Millis
      }
    })
    this.pool.overlay = V.SpritePool({
      atlas: this.preload,
      looper: this.looper,
      pageBlocks: 10
    })

    // to-do: move under Void helper methods and hide zoo? same for other APIs.
    this.zoo.addDefaultSystems()
    this.zoo.addSystem({
      clock: new ClockSys(),
      fps: new V.FPSSys(),
      debugInput: new V.DebutInputSys(),
      renderToggle: new RenderToggleSys(),
      tally: new TallySys()
    })
    const level = parseLevel(levelJSON, this.pool, this.preload)
    // to-do: validate all ents on a system add.
    this.zoo.add(...level.ents)
  }

  override onLoop(): void {
    this.zoo.update(this)

    const render =
      this.zoo.invalid ||
      this.cam.invalid ||
      this.renderer.invalid ||
      this.renderer.always
    if (render) {
      this.renderer.clear(this.backgroundRGBA)
      this.renderer.predraw(this.cam)
      this.renderer.setDepth(true)
      this.renderer.draw(this.pool.default)
      this.renderer.setDepth(false)
      this.renderer.draw(this.pool.overlay)
    }
  }

  override onUpdateCam(): void {
    if (this.input.isAnyOnStart('U', 'D', 'L', 'R'))
      this.cam.diagonalize(this.input.dir)

    const len = V.truncDrawableEpsilon(25 * this.tick.s)
    if (this.input.isOn('U')) this.cam.y -= len
    if (this.input.isOn('D')) this.cam.y += len
    if (this.input.isOn('L')) this.cam.x -= len
    if (this.input.isOn('R')) this.cam.x += len

    if (this.input.wheel?.delta.xy.y)
      this.cam.zoomOut -= this.input.wheel.delta.client.y * 0.01

    this.cam.update(this.canvas)
  }
}
