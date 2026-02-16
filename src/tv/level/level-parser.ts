import type * as V from '../../engine/index.ts'

export const parseComponent: V.ComponentHook = (_ent, json, k) => {
  if (json[k] == null) throw Error('no component val')
  switch (k) {
    case 'tilePicker':
      return {tile: 0, ...json[k]} satisfies V.Ent[typeof k]
  }
}
