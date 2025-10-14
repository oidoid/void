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
      atlas: {
        assets: 'dirname/assets/',
        image: 'dirname/dist/public/atlas.png',
        json: 'dirname/dist/public/atlas.json'
      },
      entry: 'dirname/src/index.html',
      meta: 'dirname/dist/meta.json',
      out: 'dirname/dist/public/'
    }
  )
})

test('overrides', () => {
  const config: ConfigFileSchema = {
    $schema: '$schema',
    atlas: {assets: 'assets', image: 'image', json: 'json'},
    entry: 'entry',
    meta: 'meta',
    out: 'out'
  }
  assert.deepEqual<ConfigFile>(
    parse('dirname/filename', JSON.stringify(config)),
    {
      $schema: '$schema',
      atlas: {
        assets: 'dirname/assets',
        image: 'dirname/image',
        json: 'dirname/json'
      },
      entry: 'dirname/entry',
      meta: 'dirname/meta',
      out: 'dirname/out'
    }
  )
})

test('overrides', () => {
  assert.throws(
    () => parse('dirname/filename', ''),
    Error('config dirname/filename unparsable')
  )
})
