import { memProp5x5 } from '@/mem'
import { Box, XY } from '@/ooz'
import { Font, layoutText, parseFont } from '@/void'
import { assertEquals } from 'std/testing/asserts.ts'
import { layoutWord } from './text-layout.ts'

const font: Font = parseFont(memProp5x5)
const maxWidth = 0x7fff
Deno.test('layout()', async (test) => {
  for (
    const [caseNumber, [string, width, expected]] of ([
      [
        '',
        maxWidth,
        { chars: [], cursor: new XY(0, 0 * font.lineHeight) },
      ],
      [
        ' ',
        maxWidth,
        { chars: [undefined], cursor: new XY(3, 0 * font.lineHeight) },
      ],
      [
        '\n',
        maxWidth,
        { chars: [undefined], cursor: new XY(0, 1 * font.lineHeight) },
      ],
      [
        'abc def ghi jkl mno',
        maxWidth,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(8, 0 * font.lineHeight, 3, font.cellHeight),
            undefined,
            new Box(14, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(18, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(22, 0 * font.lineHeight, 3, font.cellHeight),
            undefined,
            new Box(28, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(32, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(36, 0 * font.lineHeight, 1, font.cellHeight),
            undefined,
            new Box(40, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(44, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(48, 0 * font.lineHeight, 1, font.cellHeight),
            undefined,
            new Box(52, 0 * font.lineHeight, 5, font.cellHeight),
            new Box(58, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(62, 0 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(65, 0 * font.lineHeight),
        },
      ],
      [
        'abc def ghi jkl mno',
        10,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            undefined,
            new Box(6, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 2 * font.lineHeight, 3, font.cellHeight),
            undefined,
            new Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(8, 3 * font.lineHeight, 1, font.cellHeight),
            undefined,
            new Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 4 * font.lineHeight, 3, font.cellHeight),
            new Box(8, 4 * font.lineHeight, 1, font.cellHeight),
            undefined,
            new Box(0, 5 * font.lineHeight, 5, font.cellHeight),
            new Box(6, 5 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 6 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(3, 6 * font.lineHeight),
        },
      ],
      [
        'abc def ghi jkl mno',
        20,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(8, 0 * font.lineHeight, 3, font.cellHeight),
            undefined,
            new Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(8, 1 * font.lineHeight, 3, font.cellHeight),
            undefined,
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(8, 2 * font.lineHeight, 1, font.cellHeight),
            undefined,
            new Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(8, 3 * font.lineHeight, 1, font.cellHeight),
            undefined,
            new Box(0, 4 * font.lineHeight, 5, font.cellHeight),
            new Box(6, 4 * font.lineHeight, 3, font.cellHeight),
            new Box(10, 4 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(13, 4 * font.lineHeight),
        },
      ],
      [
        'abc def ghi jkl mno',
        21,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(8, 0 * font.lineHeight, 3, font.cellHeight),
            undefined,
            new Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(8, 1 * font.lineHeight, 3, font.cellHeight),
            undefined,
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(8, 2 * font.lineHeight, 1, font.cellHeight),
            undefined,
            new Box(12, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(16, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(20, 2 * font.lineHeight, 1, font.cellHeight),
            undefined,
            new Box(0, 3 * font.lineHeight, 5, font.cellHeight),
            new Box(6, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(10, 3 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(13, 3 * font.lineHeight),
        },
      ],
      [
        'a  b',
        4,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            undefined,
            undefined,
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(3, 2 * font.lineHeight),
        },
      ],
      [
        'a  b ',
        4,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            undefined,
            undefined,
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            undefined,
          ],
          cursor: new XY(0, 3 * font.lineHeight),
        },
      ],
    ] as const).entries()
  ) {
    await test.step(`Case ${caseNumber}: string="${string}" width=${width}.`, () =>
      assertEquals(layoutText(font, string, width), expected as unknown))
  }
})

Deno.test('layout_word()', async (test) => {
  for (
    const [caseNumber, [xy, width, string, index, expected]] of ([
      [
        new XY(0, 0 * font.lineHeight),
        maxWidth,
        ' ',
        0,
        { chars: [], cursor: new XY(0, 0 * font.lineHeight) },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        maxWidth,
        '',
        0,
        { chars: [], cursor: new XY(0, 0 * font.lineHeight) },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        maxWidth,
        '\n',
        0,
        { chars: [], cursor: new XY(0, 0 * font.lineHeight) },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        maxWidth,
        'a',
        0,
        {
          chars: [new Box(0, 0 * font.lineHeight, 3, font.cellHeight)],
          cursor: new XY(3, 0 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        maxWidth,
        '.',
        0,
        {
          chars: [new Box(0, 0 * font.lineHeight, 1, font.cellHeight)],
          cursor: new XY(1, 0 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        maxWidth,
        'a ',
        0,
        {
          chars: [new Box(0, 0 * font.lineHeight, 3, font.cellHeight)],
          cursor: new XY(3, 0 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        maxWidth,
        'a\n',
        0,
        {
          chars: [new Box(0, 0 * font.lineHeight, 3, font.cellHeight)],
          cursor: new XY(3, 0 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        maxWidth,
        'a a',
        0,
        {
          chars: [new Box(0, 0 * font.lineHeight, 3, font.cellHeight)],
          cursor: new XY(3, 0 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        maxWidth,
        'a.',
        0,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 0 * font.lineHeight, 1, font.cellHeight),
          ],
          cursor: new XY(5, 0 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        maxWidth,
        'aa',
        0,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 0 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(7, 0 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        maxWidth,
        'aa\n',
        0,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 0 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(7, 0 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        maxWidth,
        'aa aa',
        0,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 0 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(7, 0 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        maxWidth,
        'g',
        0,
        {
          chars: [new Box(0, 0 * font.lineHeight, 3, font.cellHeight)],
          cursor: new XY(3, 0 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        maxWidth,
        'abcdefgh',
        0,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(8, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(12, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(16, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(20, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(24, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(28, 0 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(31, 0 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        maxWidth,
        'abcdefgh',
        1,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(8, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(12, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(16, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(20, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(24, 0 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(27, 0 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        maxWidth,
        'abcdefgh',
        8,
        { chars: [], cursor: new XY(0, 0 * font.lineHeight) },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        0,
        'abcdefgh',
        0,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 5 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 6 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 7 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(3, 7 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        1,
        'abcdefgh',
        0,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 5 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 6 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 7 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(3, 7 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        3,
        'abcdefgh',
        0,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 5 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 6 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 7 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(3, 7 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        5,
        'abcdefgh',
        0,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 5 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 6 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 7 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(3, 7 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        6,
        'abcdefgh',
        0,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 5 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 6 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 7 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(3, 7 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        7,
        'abcdefgh',
        0,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 5 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 6 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 6 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(7, 6 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        8,
        'abcdefgh',
        0,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 3 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(7, 3 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        9,
        'abcdefgh',
        0,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 3 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(7, 3 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        10,
        'abcdefgh',
        0,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 3 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(7, 3 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        11,
        'abcdefgh',
        0,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 3 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(7, 3 * font.lineHeight),
        },
      ],
      [
        new XY(0, 0 * font.lineHeight),
        12,
        'abcdefgh',
        0,
        {
          chars: [
            new Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(8, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(8, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(4, 2 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(7, 2 * font.lineHeight),
        },
      ],
      [
        new XY(1, 0 * font.lineHeight),
        5,
        'abcdefgh',
        0,
        {
          chars: [
            new Box(1, 0 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 5 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 6 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 7 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(3, 7 * font.lineHeight),
        },
      ],
      [
        new XY(2, 0 * font.lineHeight),
        5,
        'abcdefgh',
        0,
        {
          chars: [
            new Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 5 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 6 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 7 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 8 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(3, 8 * font.lineHeight),
        },
      ],
      [
        new XY(2, 1 + 0 * font.lineHeight),
        5,
        'abcdefgh',
        0,
        {
          chars: [
            new Box(0, 1 + 1 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 + 2 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 + 3 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 + 4 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 + 5 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 + 6 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 + 7 * font.lineHeight, 3, font.cellHeight),
            new Box(0, 1 + 8 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new XY(3, 1 + 8 * font.lineHeight),
        },
      ],
    ] as const).entries()
  ) {
    await test.step(`Case ${caseNumber}: xy=${xy.toString()}, width=${width}, string="${string}", index=${index}.`, () =>
      assertEquals(
        layoutWord(font, xy, width, string, index),
        expected as unknown,
      ))
  }
})
