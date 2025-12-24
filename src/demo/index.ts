import * as V from '../index.ts'
import config from './assets/void.game.json' with {type: 'json'}
import {LoaderSys} from './ents/loader.ts'

console.debug(
  `void v${V.bundle.version}+${V.bundle.published}.${V.bundle.hash} ───oidoid>°──`
)

const v = new V.Void({
  config: config as V.GameConfig,
  preloadAtlas: document.querySelector<HTMLImageElement>('#preload-atlas'),
  loader: {loader: {level: undefined}},
  loaderSys: new LoaderSys()
})
await v.register('add')
if (V.debug) (globalThis as {v?: V.Void}).v = v
