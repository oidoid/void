import * as V from '../../engine/index.ts'
import levelJSON from '../assets/tv.level.jsonc' with {type: 'json'}
import {OpenFileHook} from '../ents/open-file.ts'
import {TilePickerHook} from '../ents/tile-picker.ts'
import {parseEntProp} from './level-parser.ts'

export class Loader implements V.Loader {
  cursor?: V.CursorEnt
  #lvl: 'Init' | undefined
  readonly #hooks = {
    anchor: new V.AnchorHook(),
    button: new V.ButtonHook(),
    cursor: new V.CursorHook(),
    hud: new V.HUDHook(),
    ninePatch: new V.NinePatchHook(),
    openFile: new OpenFileHook(),
    override: new V.OverrideHook(),
    sprite: new V.SpriteHook(),
    textWH: new V.TextWHHook(),
    textXY: new V.TextXYHook(),
    tilePicker: new TilePickerHook()
  } as const satisfies Readonly<V.HookMap>
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

    this.#updateCam(v)

    V.zooUpdate(this.#zoo.default, this.#hooks, v)

    if (v.invalid) this.#draw(v)
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

  #draw(v: V.Void): void {
    v.renderer.predraw(v.cam)
    v.renderer.clear(v.backgroundRGBA)
    v.renderer.setDepth(true)
    v.renderer.drawSprites(v.pool.default)
    v.renderer.postdraw()
  }

  get zoo(): Readonly<V.Zoo> {
    return this.#zoo
  }

  #init(v: V.Void): void {
    this.#zoo = v.loadLevel(levelJSON, 'default', parseEntProp)
    this.cursor = V.zooFindByID(this.#zoo.default, 'cursor')
    this.#lvl = 'Init'
  }
}
