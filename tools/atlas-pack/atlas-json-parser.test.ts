import {describe, test} from 'node:test'
import {assert} from '../../src/test/assert.ts'
import * as ase from './aseprite.ts'
import atlas from './atlas.test.aseprite.json' with {type: 'json'}
import {
  parseAnim,
  parseAnimFrames,
  parseAtlasJSON,
  parseCel,
  parseHitboxes
} from './atlas-json-parser.ts'

describe('parseAtlasJSON()', () => {
  test('parses file.', () => {
    // to-do: *.aseprite.json isn't working but *.aseprite.json2 does.
    assert(parseAtlasJSON(atlas as ase.Aseprite), {
      anim: {
        'background--OrangeCheckerboard': {
          cels: 1,
          h: 2,
          id: 0,
          w: 2,
          hitbox: undefined,
          hurtbox: undefined
        },
        'background--GreyCheckerboard': {
          cels: 1,
          h: 2,
          id: 1,
          w: 2,
          hitbox: undefined,
          hurtbox: undefined
        },
        'background--Kiwi': {
          cels: 1,
          h: 2,
          id: 2,
          w: 2,
          hitbox: undefined,
          hurtbox: undefined
        },
        'background--Strawberry': {
          cels: 1,
          h: 2,
          id: 3,
          w: 2,
          hitbox: undefined,
          hurtbox: undefined
        },
        'background--Grape': {
          cels: 1,
          h: 2,
          id: 4,
          w: 2,
          hitbox: undefined,
          hurtbox: undefined
        },
        'background--Blueberry': {
          cels: 1,
          h: 2,
          id: 5,
          w: 2,
          hitbox: undefined,
          hurtbox: undefined
        },
        'background--Bubblegum': {
          cels: 1,
          h: 2,
          id: 6,
          w: 2,
          hitbox: undefined,
          hurtbox: undefined
        },
        'background--Transparent': {
          cels: 1,
          h: 2,
          id: 7,
          w: 2,
          hitbox: undefined,
          hurtbox: undefined
        },
        'background--Black': {
          cels: 1,
          h: 2,
          id: 8,
          w: 2,
          hitbox: undefined,
          hurtbox: undefined
        },
        'backpacker--WalkRight': {
          cels: 16,
          h: 13,
          hitbox: {x: 2, y: 0, w: 4, h: 4},
          hurtbox: undefined,
          id: 9,
          w: 8
        },
        'backpacker--WalkDown': {
          cels: 16,
          h: 13,
          hitbox: {x: 2, y: 0, w: 4, h: 4},
          hurtbox: undefined,
          id: 10,
          w: 8
        },
        'backpacker--WalkUp': {
          cels: 16,
          h: 13,
          hitbox: {x: 2, y: 0, w: 4, h: 4},
          hurtbox: undefined,
          id: 11,
          w: 8
        },
        'cursor--Pointer': {
          cels: 1,
          h: 14,
          hitbox: {x: 0, y: 0, w: 2, h: 2},
          hurtbox: {x: 0, y: 0, w: 2, h: 2},
          id: 12,
          w: 8
        },
        'mem-prop-5x6--00': {
          cels: 1,
          h: 6,
          id: 13,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--01': {
          cels: 1,
          h: 6,
          id: 14,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--02': {
          cels: 1,
          h: 6,
          id: 15,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--03': {
          cels: 1,
          h: 6,
          id: 16,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--04': {
          cels: 1,
          h: 6,
          id: 17,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--05': {
          cels: 1,
          h: 6,
          id: 18,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--06': {
          cels: 1,
          h: 6,
          id: 19,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--07': {
          cels: 1,
          h: 6,
          id: 20,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--08': {
          cels: 1,
          h: 6,
          id: 21,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--09': {
          cels: 1,
          h: 6,
          id: 22,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--0a': {
          cels: 1,
          h: 6,
          id: 23,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--0b': {
          cels: 1,
          h: 6,
          id: 24,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--0c': {
          cels: 1,
          h: 6,
          id: 25,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--0d': {
          cels: 1,
          h: 6,
          id: 26,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--0e': {
          cels: 1,
          h: 6,
          id: 27,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--0f': {
          cels: 1,
          h: 6,
          id: 28,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--10': {
          cels: 1,
          h: 6,
          id: 29,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--11': {
          cels: 1,
          h: 6,
          id: 30,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--12': {
          cels: 1,
          h: 6,
          id: 31,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--13': {
          cels: 1,
          h: 6,
          id: 32,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--14': {
          cels: 1,
          h: 6,
          id: 33,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--15': {
          cels: 1,
          h: 6,
          id: 34,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--16': {
          cels: 1,
          h: 6,
          id: 35,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--17': {
          cels: 1,
          h: 6,
          id: 36,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--18': {
          cels: 1,
          h: 6,
          id: 37,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--19': {
          cels: 1,
          h: 6,
          id: 38,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--1a': {
          cels: 1,
          h: 6,
          id: 39,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--1b': {
          cels: 1,
          h: 6,
          id: 40,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--1c': {
          cels: 1,
          h: 6,
          id: 41,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--1d': {
          cels: 1,
          h: 6,
          id: 42,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--1e': {
          cels: 1,
          h: 6,
          id: 43,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--1f': {
          cels: 1,
          h: 6,
          id: 44,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--20': {
          cels: 1,
          h: 6,
          id: 45,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--21': {
          cels: 1,
          h: 6,
          id: 46,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--22': {
          cels: 1,
          h: 6,
          id: 47,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--23': {
          cels: 1,
          h: 6,
          id: 48,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--24': {
          cels: 1,
          h: 6,
          id: 49,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--25': {
          cels: 1,
          h: 6,
          id: 50,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--26': {
          cels: 1,
          h: 6,
          id: 51,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--27': {
          cels: 1,
          h: 6,
          id: 52,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--28': {
          cels: 1,
          h: 6,
          id: 53,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--29': {
          cels: 1,
          h: 6,
          id: 54,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--2a': {
          cels: 1,
          h: 6,
          id: 55,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--2b': {
          cels: 1,
          h: 6,
          id: 56,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--2c': {
          cels: 1,
          h: 6,
          id: 57,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--2d': {
          cels: 1,
          h: 6,
          id: 58,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--2e': {
          cels: 1,
          h: 6,
          id: 59,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--2f': {
          cels: 1,
          h: 6,
          id: 60,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--30': {
          cels: 1,
          h: 6,
          id: 61,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--31': {
          cels: 1,
          h: 6,
          id: 62,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--32': {
          cels: 1,
          h: 6,
          id: 63,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--33': {
          cels: 1,
          h: 6,
          id: 64,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--34': {
          cels: 1,
          h: 6,
          id: 65,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--35': {
          cels: 1,
          h: 6,
          id: 66,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--36': {
          cels: 1,
          h: 6,
          id: 67,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--37': {
          cels: 1,
          h: 6,
          id: 68,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--38': {
          cels: 1,
          h: 6,
          id: 69,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--39': {
          cels: 1,
          h: 6,
          id: 70,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--3a': {
          cels: 1,
          h: 6,
          id: 71,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--3b': {
          cels: 1,
          h: 6,
          id: 72,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--3c': {
          cels: 1,
          h: 6,
          id: 73,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--3d': {
          cels: 1,
          h: 6,
          id: 74,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--3e': {
          cels: 1,
          h: 6,
          id: 75,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--3f': {
          cels: 1,
          h: 6,
          id: 76,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--40': {
          cels: 1,
          h: 6,
          id: 77,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--41': {
          cels: 1,
          h: 6,
          id: 78,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--42': {
          cels: 1,
          h: 6,
          id: 79,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--43': {
          cels: 1,
          h: 6,
          id: 80,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--44': {
          cels: 1,
          h: 6,
          id: 81,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--45': {
          cels: 1,
          h: 6,
          id: 82,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--46': {
          cels: 1,
          h: 6,
          id: 83,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--47': {
          cels: 1,
          h: 6,
          id: 84,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--48': {
          cels: 1,
          h: 6,
          id: 85,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--49': {
          cels: 1,
          h: 6,
          id: 86,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--4a': {
          cels: 1,
          h: 6,
          id: 87,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--4b': {
          cels: 1,
          h: 6,
          id: 88,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--4c': {
          cels: 1,
          h: 6,
          id: 89,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--4d': {
          cels: 1,
          h: 6,
          id: 90,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--4e': {
          cels: 1,
          h: 6,
          id: 91,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--4f': {
          cels: 1,
          h: 6,
          id: 92,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--50': {
          cels: 1,
          h: 6,
          id: 93,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--51': {
          cels: 1,
          h: 6,
          id: 94,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--52': {
          cels: 1,
          h: 6,
          id: 95,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--53': {
          cels: 1,
          h: 6,
          id: 96,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--54': {
          cels: 1,
          h: 6,
          id: 97,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--55': {
          cels: 1,
          h: 6,
          id: 98,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--56': {
          cels: 1,
          h: 6,
          id: 99,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--57': {
          cels: 1,
          h: 6,
          id: 100,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--58': {
          cels: 1,
          h: 6,
          id: 101,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--59': {
          cels: 1,
          h: 6,
          id: 102,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--5a': {
          cels: 1,
          h: 6,
          id: 103,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--5b': {
          cels: 1,
          h: 6,
          id: 104,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--5c': {
          cels: 1,
          h: 6,
          id: 105,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--5d': {
          cels: 1,
          h: 6,
          id: 106,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--5e': {
          cels: 1,
          h: 6,
          id: 107,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--5f': {
          cels: 1,
          h: 6,
          id: 108,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--60': {
          cels: 1,
          h: 6,
          id: 109,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--61': {
          cels: 1,
          h: 6,
          id: 110,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--62': {
          cels: 1,
          h: 6,
          id: 111,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--63': {
          cels: 1,
          h: 6,
          id: 112,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--64': {
          cels: 1,
          h: 6,
          id: 113,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--65': {
          cels: 1,
          h: 6,
          id: 114,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--66': {
          cels: 1,
          h: 6,
          id: 115,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--67': {
          cels: 1,
          h: 6,
          id: 116,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--68': {
          cels: 1,
          h: 6,
          id: 117,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--69': {
          cels: 1,
          h: 6,
          id: 118,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--6a': {
          cels: 1,
          h: 6,
          id: 119,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--6b': {
          cels: 1,
          h: 6,
          id: 120,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--6c': {
          cels: 1,
          h: 6,
          id: 121,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--6d': {
          cels: 1,
          h: 6,
          id: 122,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--6e': {
          cels: 1,
          h: 6,
          id: 123,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--6f': {
          cels: 1,
          h: 6,
          id: 124,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--70': {
          cels: 1,
          h: 6,
          id: 125,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--71': {
          cels: 1,
          h: 6,
          id: 126,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--72': {
          cels: 1,
          h: 6,
          id: 127,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--73': {
          cels: 1,
          h: 6,
          id: 128,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--74': {
          cels: 1,
          h: 6,
          id: 129,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--75': {
          cels: 1,
          h: 6,
          id: 130,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--76': {
          cels: 1,
          h: 6,
          id: 131,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--77': {
          cels: 1,
          h: 6,
          id: 132,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--78': {
          cels: 1,
          h: 6,
          id: 133,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--79': {
          cels: 1,
          h: 6,
          id: 134,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--7a': {
          cels: 1,
          h: 6,
          id: 135,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--7b': {
          cels: 1,
          h: 6,
          id: 136,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--7c': {
          cels: 1,
          h: 6,
          id: 137,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--7d': {
          cels: 1,
          h: 6,
          id: 138,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--7e': {
          cels: 1,
          h: 6,
          id: 139,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'mem-prop-5x6--7f': {
          cels: 1,
          h: 6,
          id: 140,
          w: 5,
          hitbox: undefined,
          hurtbox: undefined
        },
        'oidoid--Default': {
          cels: 1,
          h: 16,
          id: 141,
          w: 16,
          hitbox: undefined,
          hurtbox: undefined
        }
      },
      celXY: [
        22, 37, 21, 27, 21, 29, 21, 31, 20, 33, 22, 33, 20, 35, 22, 35, 20, 37,
        24, 26, 24, 26, 8, 16, 8, 16, 0, 16, 0, 16, 16, 14, 16, 14, 72, 13, 72,
        13, 32, 26, 32, 26, 0, 16, 0, 16, 64, 13, 64, 13, 56, 13, 56, 13, 48,
        13, 48, 13, 40, 13, 40, 13, 32, 13, 32, 13, 56, 13, 56, 13, 24, 13, 24,
        13, 72, 0, 72, 0, 64, 0, 64, 0, 24, 0, 24, 0, 56, 0, 56, 0, 48, 0, 48,
        0, 48, 0, 48, 0, 24, 0, 24, 0, 40, 0, 40, 0, 32, 0, 32, 0, 32, 0, 32, 0,
        16, 0, 45, 56, 45, 56, 45, 56, 45, 56, 45, 56, 45, 56, 45, 56, 45, 56,
        45, 56, 45, 56, 45, 56, 45, 56, 45, 56, 45, 56, 45, 56, 45, 56, 45, 56,
        45, 56, 45, 56, 45, 56, 45, 56, 45, 56, 45, 56, 45, 56, 45, 56, 45, 56,
        45, 56, 45, 56, 45, 56, 45, 56, 45, 56, 45, 56, 45, 56, 40, 56, 10, 53,
        5, 53, 0, 53, 35, 51, 30, 51, 25, 51, 20, 51, 15, 51, 35, 45, 70, 50,
        65, 50, 60, 50, 55, 50, 50, 50, 45, 50, 40, 50, 10, 47, 5, 47, 0, 47,
        70, 62, 50, 56, 65, 62, 60, 62, 55, 62, 50, 62, 45, 62, 40, 62, 10, 59,
        5, 59, 0, 59, 35, 57, 70, 32, 30, 57, 25, 57, 20, 57, 15, 57, 75, 56,
        70, 56, 65, 56, 60, 56, 75, 50, 55, 56, 10, 35, 75, 32, 15, 33, 0, 35,
        5, 35, 40, 38, 45, 38, 65, 32, 60, 32, 55, 32, 50, 32, 45, 32, 40, 26,
        50, 26, 55, 26, 60, 26, 65, 26, 70, 26, 75, 26, 16, 27, 0, 29, 5, 29,
        10, 29, 40, 32, 45, 26, 10, 41, 30, 45, 25, 45, 20, 45, 15, 45, 75, 44,
        70, 44, 65, 44, 60, 44, 55, 44, 50, 44, 45, 44, 40, 44, 50, 38, 5, 41,
        0, 41, 35, 39, 30, 39, 25, 39, 20, 39, 15, 39, 75, 38, 70, 38, 65, 38,
        60, 38, 55, 38, 45, 56, 0, 0
      ]
    })
  })

  test('parses empty.', () => {
    assert(
      parseAtlasJSON({
        meta: {
          app: 'http://www.aseprite.org/',
          frameTags: [],
          size: {w: 0, h: 0},
          slices: [],
          version: '1.3.15.4-x64',
          image: 'atlas.png',
          format: 'RGBA8888',
          scale: '1'
        },
        frames: {}
      }),
      {anim: {}, celXY: []}
    )
  })

  test('parses nonempty.', () => {
    const frameTags: ase.TagSpan[] = [
      {
        color: '#000000ff',
        name: 'scenery--Cloud',
        from: 0,
        to: 0,
        direction: 'forward'
      },
      {
        color: '#000000ff',
        name: 'palette--red',
        from: 1,
        to: 1,
        direction: 'forward'
      },
      {
        color: '#000000ff',
        name: 'scenery--Conifer',
        from: 2,
        to: 2,
        direction: 'forward'
      },
      {
        color: '#000000ff',
        name: 'scenery--ConiferShadow',
        from: 3,
        to: 3,
        direction: 'forward'
      },
      {
        color: '#000000ff',
        name: 'backpacker--WalkRight',
        from: 0,
        to: 7,
        direction: 'pingpong'
      }
    ]
    const frames: ase.FrameMap = {
      'scenery--Cloud--0': {
        frame: {x: 220, y: 18, w: 18, h: 18},
        rotated: false,
        sourceSize: {w: 16, h: 16},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        trimmed: false,
        duration: 1
      },
      'palette--red--1': {
        frame: {x: 90, y: 54, w: 18, h: 18},
        rotated: false,
        sourceSize: {w: 16, h: 16},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        trimmed: false,
        duration: 65535
      },
      'scenery--Conifer--2': {
        frame: {x: 72, y: 54, w: 18, h: 18},
        rotated: false,
        sourceSize: {w: 16, h: 16},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        trimmed: false,
        duration: 65535
      },
      'scenery--ConiferShadow--3': {
        frame: {x: 54, y: 54, w: 18, h: 18},
        rotated: false,
        sourceSize: {w: 16, h: 16},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        trimmed: false,
        duration: 65535
      },
      'backpacker--WalkRight--0': {
        frame: {x: 1408, y: 28, w: 8, h: 13},
        rotated: false,
        sourceSize: {w: 8, h: 13},
        spriteSourceSize: {x: 0, y: 0, w: 8, h: 13},
        trimmed: false,
        duration: 62
      },
      'backpacker--WalkRight--1': {
        frame: {x: 1400, y: 28, w: 8, h: 13},
        rotated: false,
        sourceSize: {w: 8, h: 13},
        spriteSourceSize: {x: 0, y: 0, w: 8, h: 13},
        trimmed: false,
        duration: 62
      },
      'backpacker--WalkRight--2': {
        frame: {x: 1392, y: 28, w: 8, h: 13},
        rotated: false,
        sourceSize: {w: 8, h: 13},
        spriteSourceSize: {x: 0, y: 0, w: 8, h: 13},
        trimmed: false,
        duration: 62
      },
      'backpacker--WalkRight--3': {
        frame: {x: 1384, y: 28, w: 8, h: 13},
        rotated: false,
        sourceSize: {w: 8, h: 13},
        spriteSourceSize: {x: 0, y: 0, w: 8, h: 13},
        trimmed: false,
        duration: 62
      },
      'backpacker--WalkRight--4': {
        frame: {x: 1376, y: 28, w: 8, h: 13},
        rotated: false,
        sourceSize: {w: 8, h: 13},
        spriteSourceSize: {x: 0, y: 0, w: 8, h: 13},
        trimmed: false,
        duration: 62
      },
      'backpacker--WalkRight--5': {
        frame: {x: 1416, y: 28, w: 8, h: 13},
        rotated: false,
        sourceSize: {w: 8, h: 13},
        spriteSourceSize: {x: 0, y: 0, w: 8, h: 13},
        trimmed: false,
        duration: 62
      },
      'backpacker--WalkRight--6': {
        frame: {x: 1392, y: 28, w: 8, h: 13},
        rotated: false,
        sourceSize: {w: 8, h: 13},
        spriteSourceSize: {x: 0, y: 0, w: 8, h: 13},
        trimmed: false,
        duration: 62
      },
      'backpacker--WalkRight--7': {
        frame: {x: 1368, y: 28, w: 8, h: 13},
        rotated: false,
        sourceSize: {w: 8, h: 13},
        spriteSourceSize: {x: 0, y: 0, w: 8, h: 13},
        trimmed: false,
        duration: 62
      },
      'backpacker--WalkDown--8': {
        frame: {x: 1360, y: 28, w: 8, h: 13},
        rotated: false,
        sourceSize: {w: 8, h: 13},
        spriteSourceSize: {x: 0, y: 0, w: 8, h: 13},
        trimmed: false,
        duration: 62
      }
    }
    const slices: ase.Slice[] = [
      {
        name: 'scenery--Cloud',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 8, y: 12, w: 2, h: 3}}]
      },
      {
        name: 'scenery--Cloud',
        color: '#00ff00ff',
        keys: [{frame: 0, bounds: {x: 1, y: 2, w: 3, h: 4}}]
      },
      {
        name: 'palette--red',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 7, y: 11, w: 3, h: 4}}]
      },
      {
        name: 'scenery--Conifer',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 7, y: 10, w: 3, h: 5}}]
      },
      {
        name: 'scenery--ConiferShadow',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 7, y: 9, w: 3, h: 6}}]
      },
      {
        name: 'backpacker--WalkRight',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 2, y: 0, w: 4, h: 4}}]
      }
    ]
    assert(
      parseAtlasJSON({
        meta: {
          app: 'http://www.aseprite.org/',
          frameTags,
          size: {w: 0, h: 0},
          slices,
          version: '1.3.15.4-x64',
          image: 'atlas.png',
          format: 'RGBA8888',
          scale: '1'
        },
        frames
      }),
      {
        anim: {
          'scenery--Cloud': {
            cels: 1,
            id: 0,
            w: 16,
            h: 16,
            hitbox: {x: 8, y: 12, w: 2, h: 3},
            hurtbox: {x: 1, y: 2, w: 3, h: 4}
          },
          'palette--red': {
            cels: 1,
            id: 1,
            w: 16,
            h: 16,
            hitbox: {x: 7, y: 11, w: 3, h: 4},
            hurtbox: undefined
          },
          'scenery--Conifer': {
            cels: 1,
            id: 2,
            w: 16,
            h: 16,
            hitbox: {x: 7, y: 10, w: 3, h: 5},
            hurtbox: undefined
          },
          'scenery--ConiferShadow': {
            cels: 1,
            id: 3,
            w: 16,
            h: 16,
            hitbox: {x: 7, y: 9, w: 3, h: 6},
            hurtbox: undefined
          },
          'backpacker--WalkRight': {
            cels: 14,
            id: 4,
            w: 8,
            h: 13,
            hitbox: {x: 2, y: 0, w: 4, h: 4},
            hurtbox: undefined
          }
        },
        celXY: [
          221, 19, 91, 55, 73, 55, 55, 55, 1408, 28, 1400, 28, 1392, 28, 1384,
          28, 1376, 28, 1416, 28, 1392, 28, 1368, 28, 1392, 28, 1416, 28, 1376,
          28, 1384, 28, 1392, 28, 1400, 28
        ]
      }
    )
  })

  test('throws Error on duplicate FrameTag.', () => {
    const frameTags: ase.TagSpan[] = [
      {
        color: '#000000ff',
        name: 'scenery--Cloud',
        from: 0,
        to: 0,
        direction: 'forward'
      },
      {
        color: '#000000ff',
        name: 'palette--red',
        from: 1,
        to: 1,
        direction: 'forward'
      },
      {
        color: '#000000ff',
        name: 'scenery--Cloud',
        from: 0,
        to: 0,
        direction: 'forward'
      }
    ]
    const frames: ase.FrameMap = {
      'scenery--Cloud--0': {
        frame: {x: 220, y: 18, w: 18, h: 18},
        rotated: false,
        sourceSize: {w: 16, h: 16},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        trimmed: false,
        duration: 1
      },
      'palette--red--1': {
        frame: {x: 90, y: 54, w: 18, h: 18},
        rotated: false,
        sourceSize: {w: 16, h: 16},
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        trimmed: false,
        duration: 65535
      }
    }
    assert.throws(
      () =>
        parseAtlasJSON({
          meta: {
            app: 'http://www.aseprite.org/',
            frameTags,
            size: {w: 0, h: 0},
            slices: [],
            version: '1.3.15.4-x64',
            image: 'atlas.png',
            format: 'RGBA8888',
            scale: '1'
          },
          frames
        }),
      /atlas tag "scenery--Cloud" duplicate/
    )
  })
})

describe('parseAnim()', () => {
  test('parses FrameTag, Frame from Frame[], and Slice.', () => {
    const frameTag: ase.TagSpan = {
      color: '#000000ff',
      direction: 'pingpong',
      name: 'cloud--s',
      from: 1,
      to: 1
    }
    const frames: ase.FrameMap = {
      'cloud--xs--0': {
        frame: {x: 202, y: 36, w: 18, h: 18},
        rotated: false,
        trimmed: false,
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535
      },
      'cloud--s--1': {
        frame: {x: 184, y: 36, w: 18, h: 18},
        rotated: false,
        trimmed: false,
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535
      },
      'cloud--m--2': {
        frame: {x: 166, y: 36, w: 18, h: 18},
        rotated: false,
        trimmed: false,
        spriteSourceSize: {x: 0, y: 0, w: 16, h: 16},
        sourceSize: {w: 16, h: 16},
        duration: 65535
      }
    }
    const slices: ase.Slice[] = [
      {
        name: 'cloud--xs',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 4, y: 12, w: 7, h: 3}}]
      },
      {
        name: 'cloud--s',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 4, y: 11, w: 9, h: 4}}]
      },
      {
        name: 'cloud--m',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 3, y: 11, w: 10, h: 4}}]
      }
    ]
    assert(parseAnim(16, frameTag, frames, slices), {
      cels: 1,
      id: 16,
      w: 16,
      h: 16,
      hitbox: {x: 4, y: 11, w: 9, h: 4},
      hurtbox: undefined
    })
  })

  test('throws error when no frame is associated with tag.', () => {
    const frameTag: ase.TagSpan = {
      color: '#000000ff',
      direction: 'pingpong',
      name: 'frog--walk',
      from: 0,
      to: 0
    }
    assert.throws(
      () => parseAnim(16, frameTag, {}, []),
      /no atlas frame "frog--walk--0"/
    )
  })
})

describe('parseAnimFrames()', () => {
  test('single cell', () => {
    for (const direction of Object.values(ase.Direction)) {
      const span: ase.TagSpan = {
        color: '#000000ff',
        direction,
        name: 'stem--foo',
        from: 0,
        to: 0
      }
      const map: ase.FrameMap = {
        'stem--foo--0': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        }
      }
      assertAnimFrames(span, map, [0], direction)
    }
  })

  test('full anim', () => {
    const expected: {[dir in ase.Direction]: number[]} = {
      forward: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      pingpong: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      pingpong_reverse: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
      reverse: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    }
    for (const direction of Object.values(ase.Direction)) {
      const span: ase.TagSpan = {
        color: '#000000ff',
        direction,
        name: 'stem--foo',
        from: 0,
        to: 15
      }
      const map: ase.FrameMap = {
        'stem--foo--0': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--1': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--2': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--3': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--4': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--5': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--6': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--7': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--8': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--9': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--10': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--11': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--12': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--13': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--14': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--15': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        }
      }
      assertAnimFrames(span, map, expected[direction], direction)
    }
  })

  test('short anim', () => {
    const expected: {[dir in ase.Direction]: number[]} = {
      forward: [0, 1, 2],
      pingpong: [0, 1, 2, 1],
      pingpong_reverse: [2, 1, 0, 1],
      reverse: [2, 1, 0]
    }
    for (const direction of Object.values(ase.Direction)) {
      const span: ase.TagSpan = {
        color: '#000000ff',
        direction,
        name: 'stem--foo',
        from: 0,
        to: 2
      }
      const map: ase.FrameMap = {
        'stem--foo--0': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--1': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--2': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        }
      }
      assertAnimFrames(span, map, expected[direction], direction)
    }
  })

  test('short anim with another anim', () => {
    const expected: {[dir in ase.Direction]: number[]} = {
      forward: [1, 2, 3],
      pingpong: [1, 2, 3, 2],
      pingpong_reverse: [3, 2, 1, 2],
      reverse: [3, 2, 1]
    }
    for (const direction of Object.values(ase.Direction)) {
      const span: ase.TagSpan = {
        color: '#000000ff',
        direction,
        name: 'stem--bar',
        from: 1,
        to: 3
      }
      const map: ase.FrameMap = {
        'stem--foo--0': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--bar--1': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--bar--2': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--bar--3': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        }
      }
      assertAnimFrames(span, map, expected[direction], direction)
    }
  })

  test('short anim with multi-cel durations', () => {
    const expected: {[dir in ase.Direction]: number[]} = {
      forward: [0, 1, 1, 2],
      pingpong: [0, 1, 1, 2, 1, 1],
      pingpong_reverse: [2, 1, 1, 0, 1, 1],
      reverse: [2, 1, 1, 0]
    }
    for (const direction of Object.values(ase.Direction)) {
      const span: ase.TagSpan = {
        color: '#000000ff',
        direction,
        name: 'stem--foo',
        from: 0,
        to: 2
      }
      const map: ase.FrameMap = {
        'stem--foo--0': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--1': {
          duration: 63,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        },
        'stem--foo--2': {
          duration: 1,
          frame: {x: 0, y: 0, w: 0, h: 0},
          rotated: false,
          trimmed: false,
          spriteSourceSize: {x: 0, y: 0, w: 0, h: 0},
          sourceSize: {w: 0, h: 0}
        }
      }
      assertAnimFrames(span, map, expected[direction], direction)
    }
  })
})

describe('parseCel()', () => {
  test('parses 1:1 texture mapping/', () => {
    const frame: ase.Frame = {
      frame: {x: 1, y: 2, w: 3, h: 4},
      rotated: false,
      trimmed: false,
      spriteSourceSize: {x: 0, y: 0, w: 3, h: 4},
      sourceSize: {w: 3, h: 4},
      duration: 1
    }
    assert(parseCel(frame), {x: 1, y: 2})
  })

  test('parses texture mapping with padding', () => {
    const frame: ase.Frame = {
      frame: {x: 1, y: 2, w: 5, h: 6},
      rotated: false,
      trimmed: false,
      spriteSourceSize: {x: 0, y: 0, w: 3, h: 4},
      sourceSize: {w: 3, h: 4},
      duration: 1
    }
    assert(parseCel(frame), {x: 2, y: 3})
  })
})

describe('parseHitboxes()', () => {
  test('parses hitbox.', () => {
    const span: ase.TagSpan = {
      color: '#000000ff',
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 0
    }
    const slices: ase.Slice[] = [
      {
        name: 'stem--foo',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}]
      }
    ]
    assert(parseHitboxes(span, slices), {
      hitbox: {x: 0, y: 1, w: 2, h: 3},
      hurtbox: undefined
    })
  })

  test('parses hurtbox.', () => {
    const span: ase.TagSpan = {
      color: '#000000ff',
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 0
    }
    const slices: ase.Slice[] = [
      {
        name: 'stem--foo',
        color: '#00ff00ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}]
      }
    ]
    assert(parseHitboxes(span, slices), {
      hitbox: undefined,
      hurtbox: {x: 0, y: 1, w: 2, h: 3}
    })
  })

  test('parses hitbox and hurtbox (blue).', () => {
    const span: ase.TagSpan = {
      color: '#000000ff',
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 0
    }
    const slices: ase.Slice[] = [
      {
        name: 'stem--foo',
        color: '#0000ffff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}]
      }
    ]
    assert(parseHitboxes(span, slices), {
      hitbox: {x: 0, y: 1, w: 2, h: 3},
      hurtbox: {x: 0, y: 1, w: 2, h: 3}
    })
  })

  test('parses hitbox and hurtbox.', () => {
    const span: ase.TagSpan = {
      color: '#000000ff',
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 0
    }
    const slices: ase.Slice[] = [
      {
        name: 'stem--foo',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}]
      },
      {
        name: 'stem--foo',
        color: '#00ff00ff',
        keys: [{frame: 0, bounds: {x: 4, y: 5, w: 6, h: 7}}]
      }
    ]
    assert(parseHitboxes(span, slices), {
      hitbox: {x: 0, y: 1, w: 2, h: 3},
      hurtbox: {x: 4, y: 5, w: 6, h: 7}
    })
  })

  test('filters out unrelated tags.', () => {
    const span: ase.TagSpan = {
      color: '#000000ff',
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 0
    }
    const slices: ase.Slice[] = [
      {
        name: 'unrelated--bar',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}]
      },
      {
        name: 'stem--foo',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 4, y: 5, w: 6, h: 7}}]
      }
    ]
    assert(parseHitboxes(span, slices), {
      hitbox: {x: 4, y: 5, w: 6, h: 7},
      hurtbox: undefined
    })
  })

  test('throws on frame with multiple keys.', () => {
    const span: ase.TagSpan = {
      color: '#000000ff',
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 2
    }
    const slices: ase.Slice[] = [
      {
        name: 'stem--foo',
        color: '#0000ffff',
        keys: [
          {frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}},
          {frame: 1, bounds: {x: 4, y: 5, w: 6, h: 7}},
          {frame: 2, bounds: {x: 8, y: 9, w: 10, h: 11}}
        ]
      }
    ]
    assert.throws(
      () => parseHitboxes(span, slices),
      /atlas tag "stem--foo" hitbox bounds varies across frames/
    )
  })

  test('defaults to undefined hitbox.', () => {
    const span: ase.TagSpan = {
      color: '#000000ff',
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 0
    }
    assert(parseHitboxes(span, []), {
      hitbox: undefined,
      hurtbox: undefined
    })
  })

  test('throws on unsupported color.', () => {
    const span: ase.TagSpan = {
      color: '#000000ff',
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 0
    }
    const slices: ase.Slice[] = [
      {
        name: 'stem--foo',
        color: '#ff00ffff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}]
      }
    ]
    assert.throws(
      () => parseHitboxes(span, slices),
      /atlas tag "stem--foo" hitbox color #ff00ffff unsupported/
    )
  })

  test('throws on multiple hitboxes.', () => {
    const span: ase.TagSpan = {
      color: '#000000ff',
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 1
    }
    const slices: ase.Slice[] = [
      {
        name: 'stem--foo',
        color: '#ff0000ff',
        keys: [
          {frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}},
          {frame: 1, bounds: {x: 4, y: 5, w: 6, h: 7}},
          {frame: 2, bounds: {x: 12, y: 13, w: 14, h: 15}}
        ]
      },
      {
        name: 'stem--foo',
        color: '#ff0000ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}]
      }
    ]
    assert.throws(
      () => parseHitboxes(span, slices),
      /atlas tag "stem--foo" hitbox bounds varies across frames/
    )
  })

  test('throws on multiple hurtboxes.', () => {
    const span: ase.TagSpan = {
      color: '#000000ff',
      direction: 'pingpong',
      name: 'stem--foo',
      from: 0,
      to: 1
    }
    const slices: ase.Slice[] = [
      {
        name: 'stem--foo',
        color: '#00ff00ff',
        keys: [
          {frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}},
          {frame: 1, bounds: {x: 4, y: 5, w: 6, h: 7}},
          {frame: 2, bounds: {x: 12, y: 13, w: 14, h: 15}}
        ]
      },
      {
        name: 'stem--foo',
        color: '#00ff00ff',
        keys: [{frame: 0, bounds: {x: 0, y: 1, w: 2, h: 3}}]
      }
    ]
    assert.throws(
      () => parseHitboxes(span, slices),
      /atlas tag "stem--foo" hitbox bounds varies across frames/
    )
  })
})

function assertAnimFrames(
  span: Readonly<ase.TagSpan>,
  map: Readonly<ase.FrameMap>,
  expected: number[],
  msg?: string
): void {
  assert(
    [...parseAnimFrames(span, map)].map(frame =>
      Object.values(map).indexOf(frame)
    ),
    expected,
    msg
  )
}
