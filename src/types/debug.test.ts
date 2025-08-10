import assert from 'node:assert/strict'
import {test} from 'node:test'
import {Debug} from './debug.ts'

test('one param', () => {
  const location = {href: 'https://oidoid.com/?debug=render'}
  assert.deepEqual(Debug(location), {render: 'true'})
})

test('debug and params are case-insensitive', () => {
  const location = {href: 'https://oidoid.com/?Debug=Render=foo'}
  assert.deepEqual(Debug(location), {render: 'foo'})
})

test('multiple vals', () => {
  const location = {href: 'https://oidoid.com/?debug=cam,input=bar,render=foo'}
  assert.deepEqual(Debug(location), {cam: 'true', input: 'bar', render: 'foo'})
})

test('multiple vals and params', () => {
  const location = {
    href: 'https://oidoid.com/?abc=1&debug=cam,input=foo,unknown0=bar,unknown1,render=baz,&def'
  }
  assert.deepEqual(Debug(location), {
    cam: 'true',
    input: 'foo',
    unknown0: 'bar',
    unknown1: 'true',
    render: 'baz'
  })
})

test('no vals', () => {
  const location = {href: 'https://oidoid.com/?debug'}
  assert.deepEqual(Debug(location), {
    cam: 'true',
    input: 'true',
    render: 'true'
  })
})

test('no params', () => {
  const location = {href: 'https://oidoid.com/'}
  assert.deepEqual(Debug(location), undefined)
})
