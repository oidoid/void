import assert from 'node:assert/strict'
import {test} from 'node:test'
import {type ConfigFile, type ConfigFileSchema, parse} from './config-file.ts'

test('defaults', () => {
  const config: ConfigFileSchema = {}
  assert.deepEqual<ConfigFile>(
    parse('dirname/filename', JSON.stringify(config)),
    {
      $schema:
        'https://raw.githubusercontent.com/oidoid/void/refs/heads/main/schema/config-file.v0.json',
      entry: 'dirname/src/assets/index.html',
      meta: 'dirname/dist/meta.json',
      out: 'dirname/dist/public/',
      preloadAtlas: undefined,

      dirname: 'dirname',
      filename: 'dirname/filename'
    }
  )
})

test('overrides', () => {
  const config: ConfigFileSchema = {
    $schema: '$schema',
    entry: 'entry',
    meta: 'meta',
    out: 'out',
    preloadAtlas: {dir: 'dir/', image: 'image.png', json: 'json.json'}
  }
  assert.deepEqual<ConfigFile>(
    parse('dirname/filename', JSON.stringify(config)),
    {
      $schema: '$schema',
      entry: 'dirname/entry',
      meta: 'dirname/meta',
      out: 'dirname/out',
      preloadAtlas: {
        dir: 'dirname/dir/',
        image: 'dirname/image.png',
        json: 'dirname/json.json'
      },

      dirname: 'dirname',
      filename: 'dirname/filename'
    }
  )
})

test('overrides', () => {
  assert.throws(
    () => parse('dirname/filename', ''),
    Error('config dirname/filename unparsable')
  )
})
