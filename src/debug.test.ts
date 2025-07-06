import { assertEquals } from '@std/assert'
import { Debug } from './debug.ts'

Deno.test('one param', () => {
  const location = {href: 'https://oidoid.com/?debug=render'}
  assertEquals(Debug(location), {render: 'true'})
})

Deno.test('debug and params are case-insensitive', () => {
  const location = {href: 'https://oidoid.com/?Debug=Render=foo'}
  assertEquals(Debug(location), {render: 'foo'})
})

Deno.test('multiple vals', () => {
  const location = {href: 'https://oidoid.com/?debug=cam,input=bar,render=foo'}
  assertEquals(Debug(location), {cam: 'true', input: 'bar', render: 'foo'})
})

Deno.test('multiple vals and params', () => {
  const location = {
    href:
      'https://oidoid.com/?abc=1&debug=cam,input=foo,unknown0=bar,unknown1,render=baz,&def'
  }
  assertEquals(Debug(location), {
    cam: 'true',
    input: 'foo',
    unknown0: 'bar',
    unknown1: 'true',
    render: 'baz'
  })
})

Deno.test('no vals', () => {
  const location = {href: 'https://oidoid.com/?debug'}
  assertEquals(Debug(location), {cam: 'true', input: 'true', render: 'true'})
})

Deno.test('no params', () => {
  const location = {href: 'https://oidoid.com/'}
  assertEquals(Debug(location), undefined)
})
