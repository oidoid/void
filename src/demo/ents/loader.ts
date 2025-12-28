import * as V from '../../index.ts'
import levelJSON from '../assets/init.level.jsonc' with {type: 'json'}
import {parseLevel} from '../level/level-parser.ts'
import {CamSys} from './cam.ts'
import {ClockSys} from './clock.ts'
import {DrawSys} from './draw.ts'
import {RenderToggleSys} from './render-toggle.ts'
import {TallySys} from './tally.ts'

export class LoaderSys implements V.Sys {
  readonly query = 'loader'

  update(ent: V.LoaderEnt, v: V.Void): void {
    switch (ent.loader.level) {
      case undefined: {
        init(ent, v)
        return
      }
      case 'Init':
        return
      default:
        ent.loader.level satisfies never
    }
  }
}

function init(ent: V.LoaderEnt, v: V.Void): void {
  v.pool.overlay = V.SpritePool({
    atlas: v.preload,
    looper: v.looper,
    pageBlocks: 10
  })
  v.setPoller(((V.debug?.seconds ? 1 : 60) * 1000) as V.Millis, () =>
    V.millisUntilNext(new Date(), V.debug?.seconds ? 'Sec' : 'Min')
  )
  // to-do: move under Void helper methods and hide zoo? same for other APIs.
  v.zoo.addDefaultSystems()
  v.zoo.addSystem({
    cam: new CamSys(),
    clock: new ClockSys(),
    draw: new DrawSys(),
    renderToggle: new RenderToggleSys(),
    tally: new TallySys()
  })
  const level = parseLevel(levelJSON, v.pool, v.preload)
  // to-do: validate all ents on a system add.
  v.zoo.add(...level.ents)
  ent.loader.level = 'Init'
}
