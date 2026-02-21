import type * as V from '../../engine/index.ts'

export const parseEntProp: V.EntPropParser = (_ent, json, k) => {
  if (json[k] == null) throw Error('no prop val')
  switch (k) {
    case 'tilePicker':
      return {tile: 0, ...json[k]} satisfies V.Ent[typeof k]
  }
}
