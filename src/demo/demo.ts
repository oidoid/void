import {version} from '../../package.json'
import {Cam} from '../cam.ts'
import {debug} from '../debug.ts'
import {Framer} from '../framer.ts'
import {DefaultInput} from '../input/input.ts'

console.log(`void v${version} ───oidoid>°──`)

const canvas = document.querySelector('canvas')
if (!canvas) throw Error('no canvas')

const cam = new Cam()
const input = DefaultInput(cam, canvas)
input.register('add')

const framer = new Framer()
framer.onFrame = millis => {
  input.update(millis)

  canvas.width = document.documentElement.clientWidth
  canvas.height = document.documentElement.clientHeight

  cam.whClient = {w: canvas.width, h: canvas.height}

  if (debug?.input) printInput()

  canvas.getContext('2d')?.fillRect(0, 0, canvas.width, canvas.height)
}
framer.register('add')

function printInput(): void {
  if (input.started) {
    const on = !!input.on.length
    if (on) console.log(`buttons on: ${input.on.join(' ')}`)
    else console.log(`buttons off`)
    const combo = input.combo
    if (combo.length > 1 && on)
      console.log(`combo: ${combo.map(set => set.join('+')).join(' ')}`)
  }
  if (input.point?.started && input.point?.click && !input.point.pinch)
    console.log(
      `${input.point.drag.on ? 'drag' : 'click'} xy: ${input.point.xy.x} ${input.point.xy.y}`
    )
  if (input.point?.pinch)
    console.log(`pinch xy: ${input.point.pinch.xy.x} ${input.point.pinch.xy.y}`)
  if (input.wheel)
    console.log(`wheel xy: ${input.wheel.delta.xy.x} ${input.wheel.delta.xy.y}`)
}
