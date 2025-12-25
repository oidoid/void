import * as V from '../../index.ts'

export function parseLevel(
  json: Readonly<V.LevelSchema>,
  pools: Readonly<V.PoolMap>,
  atlas: Readonly<V.Atlas>
): V.Level {
  return V.parseLevel(json, pools, parseComponent, atlas)
}

/** @internal */
export const parseComponent: V.ComponentHook = (ent, json, k) => {
  if (json[k] == null) throw Error('no component val')
  switch (k) {
    case 'clock':
      return json[k] satisfies V.Ent[typeof k]
    case 'renderToggle':
      if (!ent.button) throw Error('no button in render toggle')
      V.buttonSetOn(ent as V.ButtonEnt, V.debug?.render === 'always')
      return json[k] satisfies V.Ent[typeof k]
    case 'tally':
      return {updates: 0} satisfies V.Ent[typeof k]
  }
}
