import * as V from '../../index.ts'

export const parseComponent: V.ComponentHook = (ent, json, k) => {
  if (json[k] == null) throw Error('no component val')
  switch (k) {
    case 'superball':
    case 'superballButton':
    case 'clock':
    case 'rotate':
      return json[k] satisfies V.Ent[typeof k]
    case 'renderToggle':
      if (!ent.button) throw Error('no button in render toggle')
      V.buttonSetOn(ent as V.ButtonEnt, V.debug?.render === 'always')
      return json[k] satisfies V.Ent[typeof k]
    case 'tally':
      return {updates: 0} satisfies V.Ent[typeof k]
  }
}
