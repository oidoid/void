import * as V from '@oidoid/void'

const canvas = document.querySelector('canvas')!
const engine = new V.Engine()
await engine.load(canvas, 'demo.wasm')
engine.register()
