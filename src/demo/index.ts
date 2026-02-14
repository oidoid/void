import * as V from '../index.ts'
import {description} from './assets/manifest.json' // non-standard import to treeshake.
import config from './assets/void.game.json' with {type: 'json'}
import {Loader} from './level/loader.ts'

console.debug(
  `void v${V.bundle.version}+${V.bundle.published}.${V.bundle.hash} ───oidoid>°──`
)

const v = new V.Void({
  atlas: document.querySelector<HTMLImageElement>('#atlas'),
  tileset: document.querySelector<HTMLImageElement>('#tileset'),
  config: config as V.VoidConfig,
  description,
  loader: new Loader()
})
v.setPoller(((V.debug?.seconds ? 1 : 60) * 1000) as V.Millis, () =>
  V.millisUntilNext(new Date(), V.debug?.seconds ? 'Sec' : 'Min')
)
await v.register('add')
