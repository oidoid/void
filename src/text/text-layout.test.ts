import test, {describe} from 'node:test'
import type {Font} from 'mem-font'
import {assert} from '../test/assert.ts'
import type {XY} from '../types/geo.ts'
import memProp5x6 from './mem-prop-5x6.json' with {type: 'json'}
import {layoutText, layoutWord, type TextLayout} from './text-layout.ts'

const font: Font = memProp5x6
const maxW = 8191
describe('layoutText()', () => {
  const cases: [string, number, TextLayout][] = [
    [
      '',
      maxW,
      {
        chars: [],
        cursor: {x: 0, y: 0 * font.lineH},
        wh: {h: 7, w: 0}
      }
    ],
    [
      ' ',
      maxW,
      {
        chars: [undefined],
        cursor: {x: 4, y: 0 * font.lineH},
        wh: {h: 7, w: 4}
      }
    ],
    [
      '\n',
      maxW,
      {
        chars: [undefined],
        cursor: {x: 0, y: 1 * font.lineH},
        wh: {h: 14, w: 0}
      }
    ],
    [
      'abc def ghi jkl mno',
      maxW,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 8, y: 0 * font.lineH, w: 3, h: font.cellH},
          undefined,
          {x: 13, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 17, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 21, y: 0 * font.lineH, w: 3, h: font.cellH},
          undefined,
          {x: 26, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 30, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 34, y: 0 * font.lineH, w: 1, h: font.cellH},
          undefined,
          {x: 37, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 41, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 45, y: 0 * font.lineH, w: 1, h: font.cellH},
          undefined,
          {x: 48, y: 0 * font.lineH, w: 5, h: font.cellH},
          {x: 54, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 58, y: 0 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 61, y: 0 * font.lineH},
        wh: {h: 7, w: 61}
      }
    ],
    [
      'abc def ghi jkl mno',
      10,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 8, y: 0 * font.lineH, w: 3, h: font.cellH},
          undefined,
          {x: 0, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 8, y: 1 * font.lineH, w: 3, h: font.cellH},
          undefined,
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 8, y: 2 * font.lineH, w: 1, h: font.cellH},
          undefined,
          {x: 0, y: 3 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 3 * font.lineH, w: 3, h: font.cellH},
          {x: 8, y: 3 * font.lineH, w: 1, h: font.cellH},
          undefined,
          {x: 0, y: 4 * font.lineH, w: 5, h: font.cellH},
          {x: 6, y: 4 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 5 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 3, y: 5 * font.lineH},
        wh: {h: 42, w: 10}
      }
    ],
    [
      'abc def ghi jkl mno',
      20,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 8, y: 0 * font.lineH, w: 3, h: font.cellH},
          undefined,
          {x: 0, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 8, y: 1 * font.lineH, w: 3, h: font.cellH},
          undefined,
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 8, y: 2 * font.lineH, w: 1, h: font.cellH},
          undefined,
          {x: 11, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 15, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 19, y: 2 * font.lineH, w: 1, h: font.cellH},
          undefined,
          {x: 0, y: 3 * font.lineH, w: 5, h: font.cellH},
          {x: 6, y: 3 * font.lineH, w: 3, h: font.cellH},
          {x: 10, y: 3 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 13, y: 3 * font.lineH},
        wh: {h: 28, w: 19}
      }
    ],
    [
      'abc def ghi jkl mno',
      21,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 8, y: 0 * font.lineH, w: 3, h: font.cellH},
          undefined,
          {x: 0, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 8, y: 1 * font.lineH, w: 3, h: font.cellH},
          undefined,
          {x: 13, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 17, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 21, y: 1 * font.lineH, w: 1, h: font.cellH},
          undefined,
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 8, y: 2 * font.lineH, w: 1, h: font.cellH},
          undefined,
          {x: 0, y: 3 * font.lineH, w: 5, h: font.cellH},
          {x: 6, y: 3 * font.lineH, w: 3, h: font.cellH},
          {x: 10, y: 3 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 13, y: 3 * font.lineH},
        wh: {h: 28, w: 21}
      }
    ],
    [
      'a  b',
      4,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          undefined,
          undefined,
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 3, y: 2 * font.lineH},
        wh: {h: 21, w: 3}
      }
    ],
    [
      'a  b ',
      4,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          undefined,
          undefined,
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          undefined
        ],
        cursor: {x: 0, y: 3 * font.lineH},
        wh: {h: 28, w: 3}
      }
    ]
  ]
  for (const [i, [str, w, expected]] of cases.entries()) {
    test(`Case ${i}: str="${str}" w=${w}.`, () =>
      assert(layoutText({font, str, maxW: w}), expected))
  }
})

describe('layoutWord()', () => {
  const cases: [XY, number, string, number, Omit<TextLayout, 'wh'>][] = [
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      ' ',
      0,
      {chars: [], cursor: {x: 0, y: 0 * font.lineH}}
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      '',
      0,
      {chars: [], cursor: {x: 0, y: 0 * font.lineH}}
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      '\n',
      0,
      {chars: [], cursor: {x: 0, y: 0 * font.lineH}}
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'a',
      0,
      {
        chars: [{x: 0, y: 0 * font.lineH, w: 3, h: font.cellH}],
        cursor: {x: 3, y: 0 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      '.',
      0,
      {
        chars: [{x: 0, y: 0 * font.lineH, w: 1, h: font.cellH}],
        cursor: {x: 1, y: 0 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'a ',
      0,
      {
        chars: [{x: 0, y: 0 * font.lineH, w: 3, h: font.cellH}],
        cursor: {x: 2, y: 0 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'a\n',
      0,
      {
        chars: [{x: 0, y: 0 * font.lineH, w: 3, h: font.cellH}],
        cursor: {x: 2, y: 0 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'a a',
      0,
      {
        chars: [{x: 0, y: 0 * font.lineH, w: 3, h: font.cellH}],
        cursor: {x: 2, y: 0 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'a.',
      0,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 0 * font.lineH, w: 1, h: font.cellH}
        ],
        cursor: {x: 5, y: 0 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'aa',
      0,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 0 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 7, y: 0 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'aa\n',
      0,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 0 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 6, y: 0 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'aa aa',
      0,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 0 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 6, y: 0 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'g',
      0,
      {
        chars: [{x: 0, y: 0 * font.lineH, w: 3, h: font.cellH}],
        cursor: {x: 3, y: 0 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'abcdefgh',
      0,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 8, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 12, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 16, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 20, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 24, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 28, y: 0 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 31, y: 0 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'abcdefgh',
      1,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 8, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 12, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 16, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 20, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 24, y: 0 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 27, y: 0 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'abcdefgh',
      8,
      {chars: [], cursor: {x: 0, y: 0 * font.lineH}}
    ],
    [
      {x: 0, y: 0 * font.lineH},
      0,
      'abcdefgh',
      0,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 3 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 4 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 5 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 6 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 7 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 3, y: 7 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      1,
      'abcdefgh',
      0,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 3 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 4 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 5 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 6 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 7 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 3, y: 7 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      3,
      'abcdefgh',
      0,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 3 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 4 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 5 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 6 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 7 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 3, y: 7 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      5,
      'abcdefgh',
      0,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 3 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 4 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 5 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 6 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 7 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 3, y: 7 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      6,
      'abcdefgh',
      0,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 3 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 4 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 5 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 6 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 7 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 3, y: 7 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      7,
      'abcdefgh',
      0,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 3 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 4 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 5 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 6 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 6 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 7, y: 6 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      8,
      'abcdefgh',
      0,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 3 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 3 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 7, y: 3 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      9,
      'abcdefgh',
      0,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 3 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 3 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 7, y: 3 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      10,
      'abcdefgh',
      0,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 3 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 3 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 7, y: 3 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      11,
      'abcdefgh',
      0,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 3 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 3 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 7, y: 3 * font.lineH}
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      12,
      'abcdefgh',
      0,
      {
        chars: [
          {x: 0, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 8, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 8, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 4, y: 2 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 7, y: 2 * font.lineH}
      }
    ],
    [
      {x: 1, y: 0 * font.lineH},
      5,
      'abcdefgh',
      0,
      {
        chars: [
          {x: 1, y: 0 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 3 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 4 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 5 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 6 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 7 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 3, y: 7 * font.lineH}
      }
    ],
    [
      {x: 2, y: 0 * font.lineH},
      5,
      'abcdefgh',
      0,
      {
        chars: [
          {x: 0, y: 1 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 2 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 3 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 4 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 5 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 6 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 7 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 8 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 3, y: 8 * font.lineH}
      }
    ],
    [
      {x: 2, y: 1 + 0 * font.lineH},
      5,
      'abcdefgh',
      0,
      {
        chars: [
          {x: 0, y: 1 + 1 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 + 2 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 + 3 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 + 4 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 + 5 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 + 6 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 + 7 * font.lineH, w: 3, h: font.cellH},
          {x: 0, y: 1 + 8 * font.lineH, w: 3, h: font.cellH}
        ],
        cursor: {x: 3, y: 1 + 8 * font.lineH}
      }
    ]
  ]
  for (const [i, [xy, width, string, index, expected]] of cases.entries()) {
    test(`case ${i}: xy=(${xy.x}, ${xy.y}), width=${width}, string="${string}", index=${index}.`, () =>
      assert(layoutWord(font, xy, width, string, index, 0, 1), expected))
  }
})
