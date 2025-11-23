import {describe, test} from 'node:test'
import {assert} from '../test/assert.ts'
import {isUILayer, Layer, layerOffset} from './layer.ts'

describe('layerOffset()', () => {
  test('clamp Bottom', () => {
    assert(layerOffset(Layer.Bottom, -1), Layer.Bottom)
    assert(layerOffset(Layer.Hidden, 0), Layer.Bottom)
  })

  test('clamp Top', () => assert(layerOffset(Layer.Top, 1), Layer.Top))

  test('offset', () => {
    assert(layerOffset(Layer.A, +1), Layer.B)
    assert(layerOffset(Layer.B, -1), Layer.A)
    assert(layerOffset(Layer.UIB, -2), Layer.F)
  })
})

test('isUILayer()', () => {
  assert(isUILayer(Layer.Hidden), false)
  assert(isUILayer(Layer.Bottom), false)
  assert(isUILayer(Layer.F), false)

  assert(isUILayer(Layer.UIA), true)
  assert(isUILayer(Layer.UIG), true)
  assert(isUILayer(Layer.Top), true)
})
