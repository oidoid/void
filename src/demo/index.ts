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

console.debug(
  `void v${V.bundle.version}+${V.bundle.published}.${V.bundle.hash} ───oidoid>°──`
)

const v = new V.Void({
  config: config as V.GameConfig,
  preloadAtlas: document.querySelector<HTMLImageElement>('#preload-atlas'),
  poll: {
    delay: () => renderDelayMillis(new Date(), V.debug?.seconds),
    period: ((V.debug?.seconds ? 1 : 60) * 1000) as V.Millis
  }
})

v.pool.overlay = V.SpritePool({
  atlas: v.preload,
  looper: v.looper,
  pageBlocks: 10
})

// to-do: move under Void helper methods and hide zoo? same for other APIs.
v.zoo.addDefaultSystems()
v.zoo.addSystem({
  cam: new CamSys(),
  clock: new ClockSys(),
  draw: new DrawSys(),
  fps: new V.FPSSys(),
  debugInput: new V.DebutInputSys(),
  renderToggle: new RenderToggleSys(),
  tally: new TallySys()
})
const level = parseLevel(levelJSON, v.pool, v.preload)
// to-do: validate all ents on a system add.
v.zoo.add(...level.ents)

await v.register('add')
if (V.debug) (globalThis as {v?: V.Void}).v = v
