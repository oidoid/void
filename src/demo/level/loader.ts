import * as V from '../../index.ts'
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
    v.setPoller(((V.debug?.seconds ? 1 : 60) * 1000) as V.Millis, () =>
      V.millisUntilNext(new Date(), V.debug?.seconds ? 'Sec' : 'Min')
    )

    this.#zoo = v.loadLevel(levelJSON, 'default', parseComponent)
    this.cursor = V.zooFindByID(this.#zoo.default, 'cursor')
    const tileset = Tileset()
    v.renderer.setTiles(tileset, LevelTiles(tileset.tileWH))
    this.#lvl = 'Init'
  }
}

function Tileset(): V.Tileset {
  const tileWH: V.WH = {w: 16, h: 16}
  return {tileWH, tiles: ['void--Nil', 'tile--GreyDots', 'tile--BlueDots']}
}

function LevelTiles(tileWH: V.WH): V.LevelTiles {
  const wh = {w: 16 * tileWH.w, h: 16 * tileWH.h}
  const tw = wh.w / tileWH.w
  const th = wh.h / tileWH.h
  const tiles = []
  for (let y = 0; y < th; y++)
    for (let x = 0; x < tw; x++) {
      const i = y * tw + x
      const border = !x || !y || x === tw - 1 || y === th - 1
      tiles[i] = border ? 1 : (x + y) % 2 === 0 ? 2 : 0
    }

  return {x: -tileWH.w * 1.5, y: -tileWH.h * 1.5, w: wh.w, h: wh.h, tiles}
}
