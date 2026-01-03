import * as V from '../index.ts'
import {description} from './assets/manifest.json' // non-standard import to treeshake.
import config from './assets/void.game.json' with {type: 'json'}
import {LoaderSys} from './ents/loader.ts'

console.debug(
  `void v${V.bundle.version}+${V.bundle.published}.${V.bundle.hash} ───oidoid>°──`
)

const v = new V.Void({
  config: config as V.GameConfig,
  description,
  preloadAtlas: document.querySelector<HTMLImageElement>('#preload-atlas'),
  loader: {loader: {level: undefined}},
  loaderSys: new LoaderSys()
})
v.setPoller(((V.debug?.seconds ? 1 : 60) * 1000) as V.Millis, () =>
  V.millisUntilNext(new Date(), V.debug?.seconds ? 'Sec' : 'Min')
)
await v.register('add')
