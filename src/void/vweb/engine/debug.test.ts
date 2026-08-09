import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {Debug} from './debug.ts'

test('one param', () => {
  const url = 'https://oidoid.com/?debug=draw'
  assert(Debug(url), {draw: 'true'})
})

test('debug and params are case-insensitive', () => {
  const url = 'https://oidoid.com/?Debug=draw=foo'
  assert(Debug(url), {draw: 'foo'})
})

test('multiple vals', () => {
  const url = 'https://oidoid.com/?debug=cam,input=bar,draw=Foo'
  assert(Debug(url), {cam: 'true', input: 'bar', draw: 'Foo'})
})

test('multiple vals and params', () => {
  const url =
    'https://oidoid.com/?abc=1&debug=cam,input=foo,unknown0=Bar,Unknown1,draw=baz,&def'

  const debug = Debug(url)
  assert(debug, {
    cam: 'true',
    input: 'foo',
    unknown0: 'Bar',
    unknown1: 'true',
    draw: 'baz'
  } as Debug)
  assert((debug as unknown as {unknown1: string}).unknown1, 'true')
  assert((debug as unknown as {unknown2: undefined}).unknown2, undefined)
})

test('no vals', () => {
  const url = 'https://oidoid.com/?debug'
  const debug = Debug(url)
  assert(debug?.cam, 'true')
  assert(debug?.input, 'true')
  assert(debug?.draw, undefined)
})

test('all', () => {
  const url = 'https://oidoid.com/?debug=all,abc=def'
  const debug = Debug(url)
  assert(debug?.cam, 'true')
  assert(debug?.input, 'true')
  assert(debug?.invalid, 'true')
  assert(debug?.mem, 'true')
  assert(debug?.draw, undefined)
  assert((debug as {abc: string}).abc, 'def')
})

test('void', () => {
  const url = 'https://oidoid.com/?debug=nativescale,void,draw=always'
  const debug = Debug(url)
  assert(debug?.cam, 'true')
  assert(debug?.input, 'true')
  assert(debug?.invalid, undefined)
  assert(debug?.mem, 'true')
  assert(debug?.draw, 'always')
  assert((debug as {nativescale: string}).nativescale, 'true')
  assert((debug as {unknown?: string}).unknown, undefined)
})

test('no params', () => {
  const url = 'https://oidoid.com/'
  assert(Debug(url), undefined)
})
