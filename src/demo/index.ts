import * as V from '../index.ts'
import {Game} from './game.ts'

console.debug(`void v${V.version} ───oidoid>°──`)

const v = new Game()
v.register('add')
if (V.debug) (globalThis as unknown as {v: Game}).v = v

// need to not consider gamepad connected as invalid because this will always render, want always poll not always render in that case. need to propagate connected event.
// to-do: gamepad connected listeren
