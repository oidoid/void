import * as V from '@oidoid/void'
import wasm from '../../../dist/demo/index.wasm'

const engine = new V.Engine()
await engine.load(undefined, wasm, 0xe6e6e6ff)
engine.register()
