import * as V from '../../engine/index.ts'
import levelJSON from '../assets/init.level.jsonc' with {type: 'json'}
import {CamHook} from '../ents/cam.ts'
import {ClockHook} from '../ents/clock.ts'
import {DrawHook} from '../ents/draw.ts'
import {MouseStatusHook} from '../ents/mouse-status.ts'
import {RenderToggleHook} from '../ents/render-toggle.ts'
import {RotateHook} from '../ents/rotate.ts'
import {ScreenshotButtonHook} from '../ents/screenshot-button.ts'
import {SuperballHook} from '../ents/superball.ts'
import {SuperballButtonHook} from '../ents/superball-button.ts'
import {TallyHook} from '../ents/tally.ts'

import {parseEntProp} from './level-parser.ts'

export class Loader implements V.Loader {
  cursor: V.CursorEnt | undefined
  #lvl: 'Init' | undefined
  readonly #hooks: Readonly<V.HookMap> = {
    button: new V.ButtonHook(),
    cam: new CamHook(),
    camStatus: new V.CamStatusHook(),
    clock: new ClockHook(),
    cursor: new V.CursorHook(),
    debugInput: new V.DebutInputHook(),
    debugLoseContextButton: new V.DebugLoseContextButtonHook(),
    draw: new DrawHook(),
    fps: new V.FPSHook(),
    fullscreenToggle: new V.FullscreenToggleHook(),
    hud: new V.HUDHook(),
    mouseStatus: new MouseStatusHook(),
    ninePatch: new V.NinePatchHook(),
    override: new V.OverrideHook(),
    renderToggle: new RenderToggleHook(),
    rotate: new RotateHook(),
    screenshotButton: new ScreenshotButtonHook(),
    sprite: new V.SpriteHook(),
    superball: new SuperballHook(),
    superballButton: new SuperballButtonHook(),
    tally: new TallyHook(),
    textWH: new V.TextWHHook(),
    textXY: new V.TextXYHook(),
    zooStatus: new V.ZooStatusHook()
  }
  #zoo: V.Zoo = {coords: new Set(), default: new Set()}

  update(v: V.Void): void {
    switch (this.#lvl) {
      case undefined:
        this.#init(v)
        V.zooUpdate(this.#zoo.coords, this.#hooks, v)
        break
      case 'Init':
        break
      default:
        this.#lvl satisfies never
    }

    V.zooUpdate(this.#zoo.default, this.#hooks, v)
  }

  get zoo(): Readonly<V.Zoo> {
    return this.#zoo
  }

  #init(v: V.Void): void {
    v.pool.overlay = V.SpritePool({
      atlas: v.atlas.default,
      looper: v.looper,
      pageBlocks: 10
    })
    v.setInterval(((V.debug?.seconds ? 1 : 60) * 1000) as V.Millis, () =>
      V.millisUntilNext(new Date(), V.debug?.seconds ? 'Sec' : 'Min')
    )

    this.#zoo = v.loadLevel(levelJSON, 'default', parseEntProp)
    this.cursor = V.zooFindByID(this.#zoo.default, 'cursor')
    this.#lvl = 'Init'
  }
}
