import {describe, expect, test} from 'bun:test'
import {parseComputedColor, rgbaHex} from './color-util.ts'

describe('parseComputedColor()', () => {
  test('rgb', () => {
    expect(parseComputedColorHex('rgb(18, 52, 86)')).toBe(`#123456ff`)
    expect(parseComputedColorHex('rgb(255, 0, 0)')).toBe(`#ff0000ff`)
    expect(parseComputedColorHex('rgb(0,0,0)')).toBe(`#000000ff`)
    expect(parseComputedColorHex('rgb(12.4, 34.5, 56.6)')).toBe(`#0c2339ff`)
  })

  test('a', () => {
    expect(parseComputedColorHex('rgba(255, 0, 0, 0.5)')).toBe(`#ff000080`)
    expect(parseComputedColorHex('rgba(0, 255, 0, .25)')).toBe(`#00ff0040`)
    expect(parseComputedColorHex('rgba(0, 0, 255, 1)')).toBe(`#0000ffff`)
  })
})

function parseComputedColorHex(rgba: string): string {
  return rgbaHex(parseComputedColor(rgba))
}
