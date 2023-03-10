import { memProp5x5 } from '@/mem'
import { I16, I16Box, I16XY, Uint } from '@/ooz'
import { Font, FontParser, TextLayout } from '@/void'
import { assertEquals } from 'std/testing/asserts.ts'

const font: Font = FontParser.parse(memProp5x5, I16)
Deno.test('layout()', async (test) => {
  for (
    const [caseNumber, [string, width, expected]] of ([
      [
        '',
        I16.max,
        { chars: [], cursor: new I16XY(0, 0 * font.lineHeight) },
      ],
      [
        ' ',
        I16.max,
        { chars: [undefined], cursor: new I16XY(3, 0 * font.lineHeight) },
      ],
      [
        '\n',
        I16.max,
        { chars: [undefined], cursor: new I16XY(0, 1 * font.lineHeight) },
      ],
      [
        'abc def ghi jkl mno',
        I16.max,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(8, 0 * font.lineHeight, 3, font.cellHeight),
            undefined,
            new I16Box(14, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(18, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(22, 0 * font.lineHeight, 3, font.cellHeight),
            undefined,
            new I16Box(28, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(32, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(36, 0 * font.lineHeight, 1, font.cellHeight),
            undefined,
            new I16Box(40, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(44, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(48, 0 * font.lineHeight, 1, font.cellHeight),
            undefined,
            new I16Box(52, 0 * font.lineHeight, 5, font.cellHeight),
            new I16Box(58, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(62, 0 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(65, 0 * font.lineHeight),
        },
      ],
      [
        'abc def ghi jkl mno',
        10,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            undefined,
            new I16Box(6, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 2 * font.lineHeight, 3, font.cellHeight),
            undefined,
            new I16Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(8, 3 * font.lineHeight, 1, font.cellHeight),
            undefined,
            new I16Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 4 * font.lineHeight, 3, font.cellHeight),
            new I16Box(8, 4 * font.lineHeight, 1, font.cellHeight),
            undefined,
            new I16Box(0, 5 * font.lineHeight, 5, font.cellHeight),
            new I16Box(6, 5 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 6 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(3, 6 * font.lineHeight),
        },
      ],
      [
        'abc def ghi jkl mno',
        20,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(8, 0 * font.lineHeight, 3, font.cellHeight),
            undefined,
            new I16Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(8, 1 * font.lineHeight, 3, font.cellHeight),
            undefined,
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(8, 2 * font.lineHeight, 1, font.cellHeight),
            undefined,
            new I16Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(8, 3 * font.lineHeight, 1, font.cellHeight),
            undefined,
            new I16Box(0, 4 * font.lineHeight, 5, font.cellHeight),
            new I16Box(6, 4 * font.lineHeight, 3, font.cellHeight),
            new I16Box(10, 4 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(13, 4 * font.lineHeight),
        },
      ],
      [
        'abc def ghi jkl mno',
        21,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(8, 0 * font.lineHeight, 3, font.cellHeight),
            undefined,
            new I16Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(8, 1 * font.lineHeight, 3, font.cellHeight),
            undefined,
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(8, 2 * font.lineHeight, 1, font.cellHeight),
            undefined,
            new I16Box(12, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(16, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(20, 2 * font.lineHeight, 1, font.cellHeight),
            undefined,
            new I16Box(0, 3 * font.lineHeight, 5, font.cellHeight),
            new I16Box(6, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(10, 3 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(13, 3 * font.lineHeight),
        },
      ],
      [
        'a  b',
        4,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            undefined,
            undefined,
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(3, 2 * font.lineHeight),
        },
      ],
      [
        'a  b ',
        4,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            undefined,
            undefined,
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            undefined,
          ],
          cursor: new I16XY(0, 3 * font.lineHeight),
        },
      ],
    ] as const).entries()
  ) {
    await test.step(`Case ${caseNumber}: string="${string}" width=${width}.`, () =>
      assertEquals(
        TextLayout.layout(font, string, I16(width)),
        expected as unknown,
      ))
  }
})

Deno.test('layout_word()', async (test) => {
  for (
    const [caseNumber, [xy, width, string, index, expected]] of ([
      [
        new I16XY(0, 0 * font.lineHeight),
        I16.max,
        ' ',
        0,
        { chars: [], cursor: new I16XY(0, 0 * font.lineHeight) },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        I16.max,
        '',
        0,
        { chars: [], cursor: new I16XY(0, 0 * font.lineHeight) },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        I16.max,
        '\n',
        0,
        { chars: [], cursor: new I16XY(0, 0 * font.lineHeight) },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        I16.max,
        'a',
        0,
        {
          chars: [new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight)],
          cursor: new I16XY(3, 0 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        I16.max,
        '.',
        0,
        {
          chars: [new I16Box(0, 0 * font.lineHeight, 1, font.cellHeight)],
          cursor: new I16XY(1, 0 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        I16.max,
        'a ',
        0,
        {
          chars: [new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight)],
          cursor: new I16XY(3, 0 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        I16.max,
        'a\n',
        0,
        {
          chars: [new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight)],
          cursor: new I16XY(3, 0 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        I16.max,
        'a a',
        0,
        {
          chars: [new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight)],
          cursor: new I16XY(3, 0 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        I16.max,
        'a.',
        0,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 0 * font.lineHeight, 1, font.cellHeight),
          ],
          cursor: new I16XY(5, 0 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        I16.max,
        'aa',
        0,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 0 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(7, 0 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        I16.max,
        'aa\n',
        0,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 0 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(7, 0 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        I16.max,
        'aa aa',
        0,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 0 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(7, 0 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        I16.max,
        'g',
        0,
        {
          chars: [new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight)],
          cursor: new I16XY(3, 0 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        I16.max,
        'abcdefgh',
        0,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(8, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(12, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(16, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(20, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(24, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(28, 0 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(31, 0 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        I16.max,
        'abcdefgh',
        1,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(8, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(12, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(16, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(20, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(24, 0 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(27, 0 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        I16.max,
        'abcdefgh',
        8,
        { chars: [], cursor: new I16XY(0, 0 * font.lineHeight) },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        0,
        'abcdefgh',
        0,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 5 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 6 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 7 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(3, 7 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        1,
        'abcdefgh',
        0,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 5 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 6 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 7 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(3, 7 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        3,
        'abcdefgh',
        0,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 5 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 6 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 7 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(3, 7 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        5,
        'abcdefgh',
        0,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 5 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 6 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 7 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(3, 7 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        6,
        'abcdefgh',
        0,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 5 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 6 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 7 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(3, 7 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        7,
        'abcdefgh',
        0,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 5 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 6 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 6 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(7, 6 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        8,
        'abcdefgh',
        0,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 3 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(7, 3 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        9,
        'abcdefgh',
        0,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 3 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(7, 3 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        10,
        'abcdefgh',
        0,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 3 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(7, 3 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        11,
        'abcdefgh',
        0,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 3 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(7, 3 * font.lineHeight),
        },
      ],
      [
        new I16XY(0, 0 * font.lineHeight),
        12,
        'abcdefgh',
        0,
        {
          chars: [
            new I16Box(0, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(8, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(8, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(4, 2 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(7, 2 * font.lineHeight),
        },
      ],
      [
        new I16XY(1, 0 * font.lineHeight),
        5,
        'abcdefgh',
        0,
        {
          chars: [
            new I16Box(1, 0 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 5 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 6 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 7 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(3, 7 * font.lineHeight),
        },
      ],
      [
        new I16XY(2, 0 * font.lineHeight),
        5,
        'abcdefgh',
        0,
        {
          chars: [
            new I16Box(0, 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 4 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 5 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 6 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 7 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 8 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(3, 8 * font.lineHeight),
        },
      ],
      [
        new I16XY(2, 1 + 0 * font.lineHeight),
        5,
        'abcdefgh',
        0,
        {
          chars: [
            new I16Box(0, 1 + 1 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 + 2 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 + 3 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 + 4 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 + 5 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 + 6 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 + 7 * font.lineHeight, 3, font.cellHeight),
            new I16Box(0, 1 + 8 * font.lineHeight, 3, font.cellHeight),
          ],
          cursor: new I16XY(3, 1 + 8 * font.lineHeight),
        },
      ],
    ] as const).entries()
  ) {
    await test.step(`Case ${caseNumber}: xy=${xy.toString()}, width=${width}, string="${string}", index=${index}.`, () =>
      assertEquals(
        TextLayout.layoutWord(font, xy, I16(width), string, Uint(index)),
        expected as unknown,
      ))
  }
})
