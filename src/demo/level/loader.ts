import * as V from '../../engine/index.ts'
import levelJSON from '../assets/init.level.jsonc' with {type: 'json'}
import {CamHook} from '../ents/cam.ts'
import {ClockHook} from '../ents/clock.ts'
import {DrawHook} from '../ents/draw.ts'
import {RenderToggleHook} from '../ents/render-toggle.ts'
import {RotateHook} from '../ents/rotate.ts'
import {SuperballHook} from '../ents/superball.ts'
import {SuperballButtonHook} from '../ents/superball-button.ts'
import {TallyHook} from '../ents/tally.ts'
import {parseComponent} from './level-parser.ts'

export class Loader implements V.Loader {
  cursor: V.CursorEnt | undefined
  #lvl: 'Init' | undefined
  readonly #hooks: Readonly<V.HookMap> = {
    button: new V.ButtonHook(),
    cursor: new V.CursorHook(),
    debugInput: new V.DebutInputHook(),
    fps: new V.FPSHook(),
    hud: new V.HUDHook(),
    ninePatch: new V.NinePatchHook(),
    override: new V.OverrideHook(),
    rotate: new RotateHook(),
    superball: new SuperballHook(),
    superballButton: new SuperballButtonHook(),
    sprite: new V.SpriteHook(),
    textWH: new V.TextWHHook(),
    textXY: new V.TextXYHook(),
    cam: new CamHook(),
    clock: new ClockHook(),
    draw: new DrawHook(),
    renderToggle: new RenderToggleHook(),
    tally: new TallyHook()
  }
  #zoo: V.Zoo = {default: new Set()}

  update(v: V.Void): void {
    switch (this.#lvl) {
      case undefined:
        this.#init(v)
        break
      case 'Init':
        break
      default:
        this.#lvl satisfies never
    }

    for (const zoo of Object.values(this.#zoo)) V.zooUpdate(zoo, this.#hooks, v)
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

    this.#zoo = v.loadLevel(levelJSON, 'default', parseComponent)
    this.cursor = V.zooFindByID(this.#zoo.default, 'cursor')
    this.#lvl = 'Init'
  }
}
