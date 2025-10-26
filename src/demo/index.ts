import * as V from '../index.ts'
import {Game} from './game.ts'

console.debug(
  `void v${V.bundle.version}+${V.bundle.published}.${V.bundle.hash} ───oidoid>°──`
)

const v = new Game()
await v.register('add')
if (V.debug) (globalThis as {v?: Game}).v = v
