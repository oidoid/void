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
        w: 0,
        h: 7,
        trimmedH: 0
      }
    ],
    [
      ' ',
      maxW,
      {
        chars: [undefined],
        cursor: {x: 4, y: 0 * font.lineH},
        w: 0,
        h: 7,
        trimmedH: 5
      }
    ],
    [
      '\n',
      maxW,
      {
        chars: [undefined],
        cursor: {x: 0, y: 1 * font.lineH},
        w: 0,
        h: 14,
        trimmedH: 7
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
        w: 61,
        h: 7,
        trimmedH: 6
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
        w: 10,
        h: 42,
        trimmedH: 40
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
        w: 19,
        h: 28,
        trimmedH: 26
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
        w: 21,
        h: 28,
        trimmedH: 27
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
        w: 3,
        h: 21,
        trimmedH: 19
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
        w: 2,
        h: 28,
        trimmedH: 26
      }
    ],
    [
      'a\n',
      3,
      {
        chars: [{x: 0, y: 0 * font.lineH, w: 3, h: font.cellH}, undefined],
        cursor: {x: 0, y: 1 * font.lineH},
        w: 3,
        h: 14,
        trimmedH: 7
      }
    ]
  ]
  for (const [i, [str, w, expected]] of cases.entries()) {
    test(`Case ${i}: str="${str}" w=${w}.`, () =>
      assert(layoutText({font, text: str, maxW: w}), expected))
  }
})

describe('layoutWord()', () => {
  const cases: [
    XY,
    number,
    string,
    number,
    Omit<TextLayout, 'h' | 'trimmedH'> & {trimmedLineH: number}
  ][] = [
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      ' ',
      0,
      {chars: [], cursor: {x: 0, y: 0 * font.lineH}, trimmedLineH: 0, w: 0}
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      '',
      0,
      {chars: [], cursor: {x: 0, y: 0 * font.lineH}, trimmedLineH: 0, w: 0}
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      '\n',
      0,
      {chars: [], cursor: {x: 0, y: 0 * font.lineH}, trimmedLineH: 0, w: 0}
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'a',
      0,
      {
        chars: [{x: 0, y: 0 * font.lineH, w: 3, h: font.cellH}],
        cursor: {x: 3, y: 0 * font.lineH},
        trimmedLineH: 5,
        w: 3
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      '.',
      0,
      {
        chars: [{x: 0, y: 0 * font.lineH, w: 1, h: font.cellH}],
        cursor: {x: 1, y: 0 * font.lineH},
        trimmedLineH: 5,
        w: 1
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'a ',
      0,
      {
        chars: [{x: 0, y: 0 * font.lineH, w: 3, h: font.cellH}],
        cursor: {x: 2, y: 0 * font.lineH},
        trimmedLineH: 5,
        w: 2
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'a\n',
      0,
      {
        chars: [{x: 0, y: 0 * font.lineH, w: 3, h: font.cellH}],
        cursor: {x: 3, y: 0 * font.lineH},
        trimmedLineH: 5,
        w: 3
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'a a',
      0,
      {
        chars: [{x: 0, y: 0 * font.lineH, w: 3, h: font.cellH}],
        cursor: {x: 2, y: 0 * font.lineH},
        trimmedLineH: 5,
        w: 2
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
        cursor: {x: 5, y: 0 * font.lineH},
        trimmedLineH: 5,
        w: 5
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
        cursor: {x: 7, y: 0 * font.lineH},
        trimmedLineH: 5,
        w: 7
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
        cursor: {x: 7, y: 0 * font.lineH},
        trimmedLineH: 5,
        w: 7
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
        cursor: {x: 6, y: 0 * font.lineH},
        trimmedLineH: 5,
        w: 6
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'g',
      0,
      {
        chars: [{x: 0, y: 0 * font.lineH, w: 3, h: font.cellH}],
        cursor: {x: 3, y: 0 * font.lineH},
        trimmedLineH: 6,
        w: 3
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
        cursor: {x: 31, y: 0 * font.lineH},
        trimmedLineH: 6,
        w: 31
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
        cursor: {x: 27, y: 0 * font.lineH},
        trimmedLineH: 6,
        w: 27
      }
    ],
    [
      {x: 0, y: 0 * font.lineH},
      maxW,
      'abcdefgh',
      8,
      {chars: [], cursor: {x: 0, y: 0 * font.lineH}, trimmedLineH: 0, w: 0}
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
        cursor: {x: 3, y: 7 * font.lineH},
        trimmedLineH: 5,
        w: 4
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
        cursor: {x: 3, y: 7 * font.lineH},
        trimmedLineH: 5,
        w: 4
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
        cursor: {x: 3, y: 7 * font.lineH},
        trimmedLineH: 5,
        w: 4
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
        cursor: {x: 3, y: 7 * font.lineH},
        trimmedLineH: 5,
        w: 4
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
        cursor: {x: 3, y: 7 * font.lineH},
        trimmedLineH: 5,
        w: 4
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
        cursor: {x: 7, y: 6 * font.lineH},
        trimmedLineH: 6,
        w: 7
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
        cursor: {x: 7, y: 3 * font.lineH},
        trimmedLineH: 6,
        w: 8
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
        cursor: {x: 7, y: 3 * font.lineH},
        trimmedLineH: 6,
        w: 8
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
        cursor: {x: 7, y: 3 * font.lineH},
        trimmedLineH: 6,
        w: 8
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
        cursor: {x: 7, y: 3 * font.lineH},
        trimmedLineH: 6,
        w: 8
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
        cursor: {x: 7, y: 2 * font.lineH},
        trimmedLineH: 6,
        w: 12
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
        cursor: {x: 3, y: 7 * font.lineH},
        trimmedLineH: 5,
        w: 5
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
        cursor: {x: 3, y: 8 * font.lineH},
        trimmedLineH: 5,
        w: 4
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
        cursor: {x: 3, y: 1 + 8 * font.lineH},
        trimmedLineH: 5,
        w: 4
      }
    ]
  ]
  for (const [i, [xy, maxW, string, index, expected]] of cases.entries()) {
    test(`case ${i}: xy=(${xy.x}, ${xy.y}), maxW=${maxW}, string="${string}", index=${index}.`, () =>
      assert(layoutWord(font, xy, maxW, string, index, 0, 1, 0, 0), expected))
  }
})
