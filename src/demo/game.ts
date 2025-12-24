import * as V from '../index.ts'
import levelJSON from './assets/index.level.jsonc' with {type: 'json'}
import config from './assets/void.game.json' with {type: 'json'}
import {CamSys} from './ents/cam.ts'
import {ClockSys} from './ents/clock.ts'
import {DrawSys} from './ents/draw.ts'
import {RenderToggleSys} from './ents/render-toggle.ts'
import {TallySys} from './ents/tally.ts'
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
      cam: new CamSys(),
      clock: new ClockSys(),
      draw: new DrawSys(),
      fps: new V.FPSSys(),
      debugInput: new V.DebutInputSys(),
      renderToggle: new RenderToggleSys(),
      tally: new TallySys()
    })
    const level = parseLevel(levelJSON, this.pool, this.preload)
    // to-do: validate all ents on a system add.
    this.zoo.add(...level.ents)
  }
}
