import * as V from '@oidoid/void'

const engine = new V.Engine()
await engine.load(undefined, 'demo.wasm')
engine.register()
