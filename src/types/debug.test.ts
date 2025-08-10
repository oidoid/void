import assert from 'node:assert/strict'
import {test} from 'node:test'
import {Debug} from './debug.ts'

test('one param', () => {
  const url = 'https://oidoid.com/?debug=render'
  assert.deepEqual(Debug(url), {render: 'true'})
})

test('debug and params are case-insensitive', () => {
  const url = 'https://oidoid.com/?Debug=Render=foo'
  assert.deepEqual(Debug(url), {render: 'foo'})
})

test('multiple vals', () => {
  const url = 'https://oidoid.com/?debug=cam,input=bar,render=Foo'
  assert.deepEqual(Debug(url), {cam: 'true', input: 'bar', render: 'Foo'})
})

test('multiple vals and params', () => {
  const url =
    'https://oidoid.com/?abc=1&debug=cam,input=foo,unknown0=Bar,Unknown1,render=baz,&def'

  const debug = Debug(url)
  assert.deepEqual(debug, {
    cam: 'true',
    input: 'foo',
    unknown0: 'Bar',
    unknown1: 'true',
    render: 'baz'
  })
  assert.equal((debug as unknown as {Unknown1: string}).Unknown1, 'true')
  assert.equal((debug as unknown as {unknown2: undefined}).unknown2, undefined)
})

test('no vals', () => {
  const url = 'https://oidoid.com/?debug'
  const debug = Debug(url)
  assert.equal(debug?.cam, 'true')
  assert.equal(debug?.input, 'true')
  assert.equal(debug?.render, 'true')
  assert.equal((debug as {unknown: string}).unknown, 'true')
})

test('no params', () => {
  const url = 'https://oidoid.com/'
  assert.deepEqual(Debug(url), undefined)
})
