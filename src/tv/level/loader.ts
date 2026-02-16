import * as V from '../../engine/index.ts'
import levelJSON from '../assets/tv.level.jsonc' with {type: 'json'}
import {CamHook} from '../ents/cam.ts'
import {DrawHook} from '../ents/draw.ts'
import {TilePickerHook} from '../ents/tile-picker.ts'
import {parseComponent} from './level-parser.ts'

export class Loader implements V.Loader {
  cursor: V.CursorEnt | undefined
  #lvl: 'Init' | undefined
  readonly #hooks: Readonly<V.HookMap> = {
    button: new V.ButtonHook(),
    cursor: new V.CursorHook(),
    hud: new V.HUDHook(),
    ninePatch: new V.NinePatchHook(),
    override: new V.OverrideHook(),
    sprite: new V.SpriteHook(),
    textWH: new V.TextWHHook(),
    textXY: new V.TextXYHook(),
    cam: new CamHook(),
    draw: new DrawHook(),
    tilePicker: new TilePickerHook()
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
    this.#zoo = v.loadLevel(levelJSON, 'default', parseComponent)
    this.cursor = V.zooFindByID(this.#zoo.default, 'cursor')
    this.#lvl = 'Init'
  }
}
