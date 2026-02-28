import * as V from '../../engine/index.ts'
import levelJSON from '../assets/init.level.jsonc' with {type: 'json'}
import {ClockHook} from '../ents/clock.ts'
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
    camStatus: new V.CamStatusHook(),
    clock: new ClockHook(),
    cursor: new V.CursorHook(),
    debugInput: new V.DebutInputHook(),
    debugLoseContextButton: new V.DebugLoseContextButtonHook(),
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

    this.#updateCam(v)

    V.zooUpdate(this.#zoo.default, this.#hooks, v)

    if (v.invalid) this.#draw(v)
  }

  get zoo(): Readonly<V.Zoo> {
    return this.#zoo
  }

  #draw(v: V.Void): void {
    v.renderer.predraw(v.cam)
    v.renderer.clear(v.backgroundRGBA)
    v.renderer.setDepth(false)
    v.renderer.drawTiles(v.cam)
    v.renderer.setDepth(true)
    v.renderer.drawSprites(v.pool.default)
    v.renderer.setDepth(false)
    v.renderer.drawSprites(v.pool.overlay)
    v.renderer.postdraw()
  }

  #updateCam(v: V.Void): void {
    if (v.input.isAnyOnStart('U', 'D', 'L', 'R')) v.cam.diagonalize(v.input.dir)
    const len = V.floorSpriteEpsilon(
      (v.input.isOnStart('Shift') ? 10000 : 25) * v.tick.s
    )
    v.cam.x += v.input.dir.x * len
    v.cam.y += v.input.dir.y * len
    if (v.input.wheel?.delta.xy.y)
      v.cam.zoomOut -= v.input.wheel.delta.client.y * 0.01
    v.cam.update(v.canvas)
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
