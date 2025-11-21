import assert from 'node:assert/strict'
import {describe, test} from 'node:test'
import {isUILayer, Layer, layerOffset} from './layer.ts'

describe('layerOffset()', () => {
  test('clamp Bottom', () => {
    assert.equal(layerOffset(Layer.Bottom, -1), Layer.Bottom)
    assert.equal(layerOffset(Layer.Hidden, 0), Layer.Bottom)
  })

  test('clamp Top', () => assert.equal(layerOffset(Layer.Top, 1), Layer.Top))

  test('offset', () => {
    assert.equal(layerOffset(Layer.A, +1), Layer.B)
    assert.equal(layerOffset(Layer.B, -1), Layer.A)
    assert.equal(layerOffset(Layer.UIB, -2), Layer.F)
  })
})

test('isUILayer()', () => {
  assert.equal(isUILayer(Layer.Hidden), false)
  assert.equal(isUILayer(Layer.Bottom), false)
  assert.equal(isUILayer(Layer.F), false)

  assert.equal(isUILayer(Layer.UIA), true)
  assert.equal(isUILayer(Layer.UIG), true)
  assert.equal(isUILayer(Layer.Top), true)
})
