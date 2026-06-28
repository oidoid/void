


test('a pointer click can become a drag', async ctx => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await ctx.test('init', () => {
    assert(input.point?.drag.on, undefined)
    assert(input.point?.drag.start, undefined)
    assert(input.point?.drag.end, undefined)
    assert(input.point?.click, undefined)
    assert(input.point?.invalid, undefined)
  })

  await ctx.test('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
    )
    input.update(16 as Millis)

    assertButton(input, 'A', 'On', 'Start')
    assertCombo(input, [['A']], 'Equal', 'Start')
    assert(input.point?.drag.on, false)
    assert(input.point?.drag.start, false)
    assert(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert(input.point?.invalid, true)
  })

  await ctx.test('drag', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 6, offsetY: 2})
    )
    input.update(16 as Millis)

    assertButton(input, 'A', 'On')
    assertCombo(input, [['A']], 'Equal')
    assert(input.point?.drag.on, true)
    assert(input.point?.drag.start, true)
    assert(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert(input.point?.invalid, true)
  })

  await ctx.test('pause', () => {
    input.update(16 as Millis)

    assertButton(input, 'A', 'On')
    assertCombo(input, [['A']], 'Equal')
    assert(input.point?.drag.on, true)
    assert(input.point?.drag.start, false)
    assert(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert(input.point?.invalid, false)
  })

  await ctx.test('move', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 16, offsetY: 12})
    )
    input.update(16 as Millis)

    assertButton(input, 'A', 'On')
    assertCombo(input, [['A']], 'Equal')
    assert(input.point?.drag.on, true)
    assert(input.point?.drag.start, false)
    assert(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert(input.point?.invalid, true)
  })

  await ctx.test('release', () => {
    target.dispatchEvent(PointerTestEvent('pointerup', {}))
    input.update(16 as Millis)

    assertButton(input, 'A', 'Off', 'Start')
    assertCombo(input, [['A']], 'Equal')
    assert(input.point?.drag.on, false)
    assert(input.point?.drag.start, false)
    assert(input.point?.drag.end, true)
    assert.partialDeepStrictEqual(input.point?.click, undefined)
    assert(input.point?.invalid, true)
  })

  await ctx.test('pause again', () => {
    input.update(16 as Millis)

    assertButton(input, 'A', 'Off')
    assertCombo(input, [['A']], 'Equal')
    assert(input.point?.drag.on, false)
    assert(input.point?.drag.start, false)
    assert(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, undefined)
    assert(input.point?.invalid, false)
  })
})

test('a pointer click can become a drag or a pinch', async ctx => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await ctx.test('init', () => {
    assert(input.point?.drag.on, undefined)
    assert(input.point?.drag.start, undefined)
    assert(input.point?.drag.end, undefined)
    assert.partialDeepStrictEqual(input.point?.click, undefined)
    assert(input.point?.pinch?.xy, undefined)
    assert(input.point?.center, undefined)
    assert(input.point?.invalid, undefined)
  })

  await ctx.test('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 1, offsetY: 2})
    )
    input.update(16 as Millis)

    assertButton(input, 'A', 'On', 'Start')
    assertCombo(input, [['A']], 'Equal', 'Start')
    assert(input.point?.drag.on, false)
    assert(input.point?.drag.start, false)
    assert(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert(input.point?.pinch?.xy, undefined)
    assert.partialDeepStrictEqual(input.point?.center, {x: 1, y: 2})
    assert(input.point?.invalid, true)
  })

  await ctx.test('drag', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {buttons: 1, offsetX: 6, offsetY: 2})
    )
    input.update(16 as Millis)

    assertButton(input, 'A', 'On')
    assertCombo(input, [['A']], 'Equal')
    assert(input.point?.drag.on, true)
    assert(input.point?.drag.start, true)
    assert(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert(input.point?.pinch?.xy, undefined)
    assert.partialDeepStrictEqual(input.point?.center, {x: 6, y: 2})
    assert(input.point?.invalid, true)
  })

  await ctx.test('pinch', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {
        buttons: 1,
        offsetX: 10,
        offsetY: 10,
        pointerId: 2
      })
    )
    input.update(16 as Millis)

    assertButton(input, 'A', 'On')
    assertCombo(input, [['A']], 'Equal')
    assert(input.point?.drag.on, false)
    assert(input.point?.drag.start, false)
    assert(input.point?.drag.end, true)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert(input.point?.pinch?.xy, {x: 0, y: 0})
    assert.partialDeepStrictEqual(input.point?.center, {x: 8, y: 6})
    assert(input.point?.invalid, true)
  })

  await ctx.test('expand', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {
        buttons: 1,
        offsetX: 20,
        offsetY: 20,
        pointerId: 2
      })
    )
    input.update(16 as Millis)

    assertButton(input, 'A', 'On')
    assertCombo(input, [['A']], 'Equal')
    assert(input.point?.drag.on, false)
    assert(input.point?.drag.start, false)
    assert(input.point?.drag.end, false)
    assert.partialDeepStrictEqual(input.point?.click, {x: 1, y: 2})
    assert(input.point?.pinch?.xy, {x: 10, y: 10})
    assert.partialDeepStrictEqual(input.point?.center, {x: 13, y: 11})
    assert(input.point?.invalid, true)
  })
})


test('pinch', async ctx => {
  using secureContext = new SecureContextMock()
  secureContext.secure = false
  using dpr = new DevicePixelRatioMock()
  dpr.ratio = 1
  const target = TestElement()
  using input = DefaultInput(DefaultCam(), target).register('add')

  await ctx.test('init', () => {
    assert.partialDeepStrictEqual(input.point?.center, undefined)
    assert(input.point?.pinch, undefined)
    assert(input.point?.invalid, undefined)
  })

  await ctx.test('click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {buttons: 1, offsetX: 10, offsetY: 10})
    )
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 10, y: 10})
    assert(input.point?.pinch?.xy, undefined)
    assert(input.point?.invalid, true)
  })

  await ctx.test('secondary click', () => {
    target.dispatchEvent(
      PointerTestEvent('pointerdown', {
        buttons: 1,
        offsetX: 20,
        offsetY: 20,
        pointerId: 2
      })
    )
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 15, y: 15})
    assert(input.point?.pinch?.xy, {x: 0, y: 0})
    assert(input.point?.invalid, true)
  })

  await ctx.test('expand', () => {
    target.dispatchEvent(
      PointerTestEvent('pointermove', {
        buttons: 1,
        offsetX: 30,
        offsetY: 30,
        pointerId: 2
      })
    )
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 20, y: 20})
    assert(input.point?.pinch?.xy, {x: 10, y: 10})
    assert(input.point?.invalid, true)
  })

  await ctx.test('release', () => {
    target.dispatchEvent(PointerTestEvent('pointerup', {pointerId: 2}))
    input.update(16 as Millis)

    assert.partialDeepStrictEqual(input.point?.center, {x: 10, y: 10})
    assert(input.point?.pinch?.xy, undefined)
    assert(input.point?.invalid, true)
  })
})
