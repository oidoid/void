import {expect, test} from 'bun:test'
import {Debug} from './debug.ts'

declare module './debug.ts' {
  interface Debug {
    cam?: 'true'
    input?: string
    mem?: 'true'
    zzz?: string
  }
}

test('one param', () => {
  const url = 'https://oidoid.com/?debug=draw'
  expect(Debug(url)).toStrictEqual({draw: 'true'})
})

test('debug and params are case-insensitive', () => {
  const url = 'https://oidoid.com/?Debug=draw=foo'
  expect(Debug(url)).toStrictEqual({draw: 'foo'})
})

test('multiple vals', () => {
  const url = 'https://oidoid.com/?debug=cam,input=bar,draw=Foo'
  expect(Debug(url)).toStrictEqual({cam: 'true', input: 'bar', draw: 'Foo'})
})

test('multiple vals and params', () => {
  const url =
    'https://oidoid.com/?abc=1&debug=cam,input=foo,unknown0=Bar,Unknown1,draw=baz,&def'

  const debug = Debug(url)
  expect(debug).toStrictEqual({
    cam: 'true',
    input: 'foo',
    unknown0: 'Bar',
    unknown1: 'true',
    draw: 'baz'
  } as Debug)
  expect((debug as unknown as {unknown1: string}).unknown1).toBe('true')
  expect((debug as unknown as {unknown2: undefined}).unknown2).toBe(undefined)
})

test('no vals', () => {
  const url = 'https://oidoid.com/?debug'
  const debug = Debug(url)
  expect(debug?.looper).toBe('true')
  expect(debug?.draw).toBe(undefined)
})

test('all', () => {
  const url = 'https://oidoid.com/?debug=all,abc=def'
  const debug = Debug(url)
  expect(debug?.invalid).toBe('true')
  expect(debug?.looper).toBe('true')
  expect(debug?.draw).toBe(undefined)
  expect((debug as {abc: string}).abc).toBe('def')
})

test('void', () => {
  const url = 'https://oidoid.com/?debug=nativescale,void,draw=always'
  const debug = Debug(url)
  expect(debug?.invalid).toBe(undefined)
  expect(debug?.looper).toBe('true')
  expect(debug?.draw).toBe('always')
  expect((debug as {nativescale: string}).nativescale).toBe('true')
  expect((debug as {unknown?: string}).unknown).toBe(undefined)
})

test('zzz', () => {
  expect(Debug('https://oidoid.com/?debug=zzz')?.zzz).toBe('true')
  expect(Debug('https://oidoid.com/?debug=zzz=1')?.zzz).toBe('1')
})

test('window', () => {
  expect(Debug('https://oidoid.com/?debug=window')?.window).toBe('true')
  expect(Debug('https://oidoid.com/?debug=window=1')?.window).toBe('1')
})

test('no params', () => {
  const url = 'https://oidoid.com/'
  expect(Debug(url)).toBe(undefined)
})
