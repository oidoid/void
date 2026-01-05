import * as V from '../../index.ts'
import levelJSON from '../assets/init.level.jsonc' with {type: 'json'}
import {CamSys} from '../ents/cam.ts'
import {ClockSys} from '../ents/clock.ts'
import {DrawSys} from '../ents/draw.ts'
import {RenderToggleSys} from '../ents/render-toggle.ts'
import {TallySys} from '../ents/tally.ts'
import {parseComponent} from './level-parser.ts'

export class Loader implements V.Loader {
  cursor: V.CursorEnt | undefined
  #lvl: 'Init' | undefined
  readonly #systems: V.SysMap = {
    button: new V.ButtonSys(),
    cursor: new V.CursorSys(),
    debugInput: new V.DebutInputSys(),
    fps: new V.FPSSys(),
    hud: new V.HUDSys(),
    ninePatch: new V.NinePatchSys(),
    override: new V.OverrideSys(),
    sprite: new V.SpriteSys(),
    textWH: new V.TextWHSys(),
    textXY: new V.TextXYSys(),
    cam: new CamSys(),
    clock: new ClockSys(),
    draw: new DrawSys(),
    renderToggle: new RenderToggleSys(),
    tally: new TallySys()
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

    for (const zoo of Object.values(this.#zoo))
      V.zooUpdate(zoo, this.#systems, v)
  }

  #init(v: V.Void): void {
    v.pool.overlay = V.SpritePool({
      atlas: v.atlas.default,
      looper: v.looper,
      pageBlocks: 10
    })
    v.setPoller(((V.debug?.seconds ? 1 : 60) * 1000) as V.Millis, () =>
      V.millisUntilNext(new Date(), V.debug?.seconds ? 'Sec' : 'Min')
    )

    this.#zoo = v.loadLevel(levelJSON, 'default', parseComponent)
    this.cursor = V.zooFindByID(this.#zoo.default, 'Cursor')
    this.#lvl = 'Init'
  }
}
