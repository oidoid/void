import {describe, test} from 'node:test'
import {assert} from '../../test/assert.ts'
import type {Anim} from './atlas.ts'
import {parseAtlas, parseXYWH} from './atlas-parser.ts'

describe('parseAtlas()', () => {
  test('parses empty', () => {
    assert(parseAtlas({anim: {}, celXY: []}), {
      anim: {},
      celXYWH: [],
      tags: []
    })
  })

  test('parses nonempty', () => {
    assert(
      parseAtlas({
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
            hitbox: {x: 7, y: 11, w: 3, h: 4}
          },
          'scenery--Conifer': {
            cels: 1,
            id: 2,
            w: 16,
            h: 16,
            hitbox: {x: 7, y: 10, w: 3, h: 5}
          },
          'scenery--ConiferShadow': {
            cels: 1,
            id: 3,
            w: 16,
            h: 16,
            hitbox: {x: 7, y: 9, w: 3, h: 6}
          }
        },
        celXY: [221, 19, 91, 55, 73, 55, 55, 55]
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
            hitbox: {x: 7, y: 11, w: 3, h: 4}
          },
          'scenery--Conifer': {
            cels: 1,
            id: 2,
            w: 16,
            h: 16,
            hitbox: {x: 7, y: 10, w: 3, h: 5}
          },
          'scenery--ConiferShadow': {
            cels: 1,
            id: 3,
            w: 16,
            h: 16,
            hitbox: {x: 7, y: 9, w: 3, h: 6}
          }
        },
        celXYWH: [
          ...Array(16).fill([221, 19, 16, 16]),
          ...Array(16).fill([91, 55, 16, 16]),
          ...Array(16).fill([73, 55, 16, 16]),
          ...Array(16).fill([55, 55, 16, 16])
        ].flat(),
        tags: [
          'scenery--Cloud',
          'palette--red',
          'scenery--Conifer',
          'scenery--ConiferShadow'
        ]
      }
    )
  })
})

describe('parseXYWH()', () => {
  test('single cell', () => {
    const anim: Anim = {cels: 1, id: 0, w: 1, h: 2}
    const celXY = [3, 4]
    assert(parseXYWH(anim, celXY, 0), Array(16).fill([3, 4, 1, 2]).flat())
  })
})
