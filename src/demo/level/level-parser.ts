import * as V from '../../index.ts'
import type {Tag} from '../types/tag.ts'

export function parseLevel(
  json: Readonly<V.LevelSchema<Tag>>,
  pools: Readonly<V.PoolMap<Tag>>,
  atlas: Readonly<V.Atlas<Tag>>
): V.Level<Tag> {
  return V.parseLevel(json, pools, parseComponent, atlas)
}

/** @internal */
export const parseComponent: V.ComponentHook<Tag> = (ent, json, k) => {
  if (json[k] == null) throw Error('no component val')
  switch (k) {
    case 'clock':
    case 'debugInput':
      return json[k] satisfies V.Ent<Tag>[typeof k]
    case 'renderToggle':
      if (!ent.button) throw Error('no button in render toggle')
      V.buttonSetOn(
        ent as V.ButtonEnt<Tag, string>,
        V.debug?.render === 'always'
      )
      return json[k] satisfies V.Ent<Tag>[typeof k]
    case 'tally':
      return {updates: 0} satisfies V.Ent<Tag>[typeof k]
  }
}
