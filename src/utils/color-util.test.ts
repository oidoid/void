import assert from 'node:assert/strict'
import {describe, test} from 'node:test'
import {parseComputedColor, rgbaHex} from './color-util.ts'

describe('parseComputedColor()', () => {
  test('rgb', () => {
    assert.equal(parseComputedColorHex('rgb(18, 52, 86)'), `#123456ff`)
    assert.equal(parseComputedColorHex('rgb(255, 0, 0)'), `#ff0000ff`)
    assert.equal(parseComputedColorHex('rgb(0,0,0)'), `#000000ff`)
    assert.equal(parseComputedColorHex('rgb(12.4, 34.5, 56.6)'), `#0c2339ff`)
  })

  test('a', () => {
    assert.equal(parseComputedColorHex('rgba(255, 0, 0, 0.5)'), `#ff000080`)
    assert.equal(parseComputedColorHex('rgba(0, 255, 0, .25)'), `#00ff0040`)
    assert.equal(parseComputedColorHex('rgba(0, 0, 255, 1)'), `#0000ffff`)
  })
})

function parseComputedColorHex(rgba: string): string {
  return rgbaHex(parseComputedColor(rgba))
}
