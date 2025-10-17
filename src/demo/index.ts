import * as V from '../index.ts'
import {Game} from './game.ts'

console.debug(`void v${V.version} ───oidoid>°──`)

const v = new Game()
await v.register('add')
if (V.debug) (globalThis as unknown as {v: Game}).v = v
