import {test} from 'node:test'
import {assert} from '../../src/test/assert.ts'
import {type ConfigFileSchema, parse} from './config-file.ts'

test('defaults', () => {
  const config: ConfigFileSchema = {
    out: {dir: undefined, game: 'game', name: undefined}
  }
  assert(parse('dirname/filename', JSON.stringify(config)), {
    $schema: 'https://oidoid.github.io/void/config-file.v0.json',
    entry: 'dirname/src/assets/index.html',
    meta: 'dirname/dist/meta.json',
    out: {dir: 'dirname/dist/public/', game: 'dirname/game', name: undefined},
    preloadAtlas: undefined,

    dirname: 'dirname',
    filename: 'dirname/filename',

    init: {
      background: undefined,
      input: 'Default',
      minWH: {w: Infinity, h: Infinity},
      minScale: 1,
      mode: 'Int',
      zoomOut: 0
    }
  })
})

test('overrides', () => {
  const config: Required<ConfigFileSchema> = {
    $schema: '$schema',
    entry: 'entry',
    meta: 'meta',
    out: {dir: 'outDir', game: 'game', name: 'name'},
    preloadAtlas: {dir: 'dir/', image: 'image.webp'},
    init: {
      background: '01234567',
      input: 'Custom',
      minScale: 2,
      minWH: {w: 1, h: 2},
      mode: 'Float',
      zoomOut: 1
    }
  }
  assert(parse('dirname/filename', JSON.stringify(config)), {
    $schema: '$schema',
    entry: 'dirname/entry',
    meta: 'dirname/meta',
    out: {dir: 'dirname/outDir', game: 'dirname/game', name: 'name'},
    preloadAtlas: {dir: 'dirname/dir/', image: 'dirname/image.webp'},
    init: {
      background: 0x01234567,
      input: 'Custom',
      minWH: {w: 1, h: 2},
      minScale: 2,
      mode: 'Float',
      zoomOut: 1
    },

    dirname: 'dirname',
    filename: 'dirname/filename'
  })
})

test('overrides', () => {
  assert.throws(
    () => parse('dirname/filename', ''),
    /config dirname\/filename unparsable/
  )
})
