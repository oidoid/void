import * as V from '../../engine/index.ts'
import levelJSON from '../assets/tv.level.jsonc' with {type: 'json'}
import {LoadConfigHook} from '../ents/load-config.ts'
import {LoadLevelHook} from '../ents/load-level.ts'
import {LoadTilesetHook} from '../ents/load-tileset.ts'
import {
  loadConfigData,
  loadImgFromHandle,
  loadLevelData,
  pickOrRestore
} from '../ents/load-utils.ts'
import {loadTmp, saveTmp, type Tmp} from '../storage/tmp.ts'
import {parseEntProp} from './level-parser.ts'

export class Loader implements V.Loader {
  cursor?: V.CursorEnt
  tmp: Tmp = {config: undefined, level: undefined, tileset: undefined}
  levelTiles?: V.LevelTiles
  tileset?: V.Tileset
  tilesetImg?: HTMLImageElement
  /** index of the currently selected tile in the tileset. */
  tile: number = 0
  #lvl: 'Init' | undefined
  readonly #hooks = {
    anchor: new V.AnchorHook(),
    button: new V.ButtonHook(),
    cursor: new V.CursorHook(),
    hud: new V.HUDHook(),
    loadConfig: new LoadConfigHook(),
    loadLevel: new LoadLevelHook(),
    loadTileset: new LoadTilesetHook(),
    ninePatch: new V.NinePatchHook(),
    override: new V.OverrideHook(),
    sprite: new V.SpriteHook(),
    textWH: new V.TextWHHook(),
    textXY: new V.TextXYHook()
  } as const satisfies Readonly<V.HookMap>
  #zoo: V.Zoo = {default: new Set()}

  async loadConfig(v: V.Void): Promise<void> {
    try {
      await this.#restoreFromTmp('config')
      const handle = await pickOrRestore(
        !this.tileset ? this.tmp.config : undefined,
        {
          types: [
            {desc: 'Game Config', accept: {'application/json': ['.json']}}
          ]
        }
      )
      this.tileset = await loadConfigData(handle)
      this.tmp.config = handle
    } catch (err) {
      console.error('[load-config] failed', err)
      return
    }
    await this.saveTmp()
    this.#applyIfReady(v)
  }

  async loadLevel(v: V.Void): Promise<void> {
    try {
      await this.#restoreFromTmp('level')
      const handle = await pickOrRestore(
        !this.levelTiles ? this.tmp.level : undefined,
        {types: [{desc: 'Level', accept: {'application/json': ['.jsonc']}}]}
      )
      await loadLevelData(handle, this)
      this.tmp.level = handle
    } catch (err) {
      console.error('[load-level] failed', err)
      return
    }
    await this.saveTmp()
    this.#applyIfReady(v)
  }

  async loadTileset(v: V.Void): Promise<void> {
    try {
      await this.#restoreFromTmp('tileset')
      const handle = await pickOrRestore(
        !this.tilesetImg ? this.tmp.tileset : undefined,
        {types: [{desc: 'Tileset', accept: {'image/webp': ['.webp']}}]}
      )
      this.tilesetImg = await loadImgFromHandle(handle)
      this.tmp.tileset = handle
    } catch (err) {
      console.error('[load-tileset] failed', err)
      return
    }
    await this.saveTmp()
    this.#applyIfReady(v)
  }

  /** requires gesture. */
  async loadTmp(): Promise<void> {
    this.tmp = await loadTmp()
  }

  async saveTmp(): Promise<void> {
    await saveTmp(this.tmp)
  }

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

  get zoo(): Readonly<V.Zoo> {
    return this.#zoo
  }

  #applyIfReady(v: V.Void): void {
    if (this.tileset && this.levelTiles)
      v.renderer.setTiles(this.tileset, this.levelTiles)
    if (this.tilesetImg) v.renderer.loadTileset(this.tilesetImg)
    v.invalid = true
  }

  async #restoreFromTmp(skip: keyof Tmp): Promise<void> {
    const {config, level, tileset} = this.tmp
    if (
      skip !== 'config' &&
      !this.tileset &&
      config &&
      (await config.requestPermission({mode: 'read'})) === 'granted'
    )
      this.tileset = await loadConfigData(config)
    if (
      skip !== 'level' &&
      !this.levelTiles &&
      level &&
      (await level.requestPermission({mode: 'read'})) === 'granted'
    )
      await loadLevelData(level, this)
    if (
      skip !== 'tileset' &&
      !this.tilesetImg &&
      tileset &&
      (await tileset.requestPermission({mode: 'read'})) === 'granted'
    )
      this.tilesetImg = await loadImgFromHandle(tileset)
  }

  #draw(v: V.Void): void {
    v.renderer.predraw(v.cam)
    v.renderer.clear(v.backgroundRGBA)
    v.renderer.setDepth(false)
    v.renderer.drawTiles(v.cam)
    v.renderer.setDepth(true)
    v.renderer.drawSprites(v.pool.default)
    v.renderer.postdraw()
  }

  #init(v: V.Void): void {
    this.#zoo = v.loadLevel(levelJSON, 'default', parseEntProp)
    this.cursor = V.zooFindByID(this.#zoo.default, 'cursor')
    this.#lvl = 'Init'
    void this.loadTmp().catch(console.error)
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
}
