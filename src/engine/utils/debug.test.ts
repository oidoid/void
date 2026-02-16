import {test} from 'node:test'
import {assert} from '../../test/assert.ts'
import {Debug} from './debug.ts'

test('one param', () => {
  const url = 'https://oidoid.com/?debug=render'
  assert(Debug(url), {render: 'true'})
})

test('debug and params are case-insensitive', () => {
  const url = 'https://oidoid.com/?Debug=Render=foo'
  assert(Debug(url), {render: 'foo'})
})

test('multiple vals', () => {
  const url = 'https://oidoid.com/?debug=cam,input=bar,render=Foo'
  assert(Debug(url), {cam: 'true', input: 'bar', render: 'Foo'})
})

test('multiple vals and params', () => {
  const url =
    'https://oidoid.com/?abc=1&debug=cam,input=foo,unknown0=Bar,Unknown1,render=baz,&def'

  const debug = Debug(url)
  assert(debug, {
    cam: 'true',
    input: 'foo',
    unknown0: 'Bar',
    unknown1: 'true',
    render: 'baz'
  } as Debug)
  assert((debug as unknown as {Unknown1: string}).Unknown1, 'true')
  assert((debug as unknown as {unknown2: undefined}).unknown2, undefined)
})

test('no vals', () => {
  const url = 'https://oidoid.com/?debug'
  const debug = Debug(url)
  assert(debug?.cam, 'true')
  assert(debug?.input, 'true')
  assert(debug?.render, 'true')
  assert((debug as {unknown: string}).unknown, 'true')
})

test('all', () => {
  const url = 'https://oidoid.com/?debug=all,abc=def'
  const debug = Debug(url)
  assert(debug?.cam, 'true')
  assert(debug?.input, 'true')
  assert(debug?.mem, 'true')
  assert(debug?.render, 'true')
  assert((debug as {unknown: string}).unknown, 'true')
  assert((debug as {abc: string}).abc, 'def')
})

test('void', () => {
  const url = 'https://oidoid.com/?debug=nativescale,void,render=always'
  const debug = Debug(url)
  assert(debug?.cam, 'true')
  assert(debug?.input, 'true')
  assert(debug?.mem, 'true')
  assert(debug?.render, 'always')
  assert((debug as {nativeScale: string}).nativeScale, 'true')
  assert((debug as {unknown?: string}).unknown, undefined)
})

test('no params', () => {
  const url = 'https://oidoid.com/'
  assert(Debug(url), undefined)
})
