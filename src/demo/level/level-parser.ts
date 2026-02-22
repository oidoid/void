import * as V from '../../engine/index.ts'
import type {MouseStatus} from '../ents/ent.ts'

export const parseEntProp: V.EntPropParser = (ent, json, k, pools) => {
  if (json[k] == null) throw Error('no prop val')
  switch (k) {
    case 'mouseStatus':
      return parseMouseStatus(pools) satisfies V.Ent[typeof k]
    case 'superball':
    case 'superballButton':
    case 'clock':
    case 'rotate':
    case 'screenshotButton':
      return json[k] satisfies V.Ent[typeof k]
    case 'renderToggle':
      if (!ent.button) throw Error('no button in render toggle')
      V.buttonSetOn(ent as V.ButtonEnt, V.debug?.render === 'always')
      return json[k] satisfies V.Ent[typeof k]
    case 'tally':
      return {updates: 0} satisfies V.Ent[typeof k]
  }
}

function parseMouseStatus(pools: Readonly<V.PoolMap>): MouseStatus {
  const alloc = (tag: V.Tag) => {
    // to-do: carry over base sprite pool?
    const sprite = pools.default.alloc() // to-do: lame this doesn't take tag.
    sprite.tag = tag
    return sprite
  }
  return {
    primary: alloc('mouse-status--Primary'),
    secondary: alloc('mouse-status--Secondary'),
    tertiary: alloc('mouse-status--Tertiary'),
    locked: alloc('mouse-status--Locked')
  }
}
