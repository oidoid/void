import * as V from '../../engine/index.ts'
import type {Mouse} from '../ents/ent.ts'

export const parseEntProp: V.EntPropParser = (ent, json, k, pools) => {
  if (json[k] == null) throw Error('no prop val')
  switch (k) {
    case 'mouse':
      return parseMouse(pools) satisfies V.Ent[typeof k]
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

function parseMouse(pools: Readonly<V.PoolMap>): Mouse {
  const alloc = (tag: V.Tag) => {
    // to-do: carry over base sprite pool?
    const sprite = pools.default.alloc() // to-do: lame this doesn't take tag.
    sprite.tag = tag
    return sprite
  }
  return {
    primary: alloc('mouse--Primary'),
    secondary: alloc('mouse--Secondary'),
    tertiary: alloc('mouse--Tertiary'),
    locked: alloc('mouse--Locked')
  }
}
