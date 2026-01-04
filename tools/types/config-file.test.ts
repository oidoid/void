import path from 'node:path'
import {test} from 'node:test'
import {assert} from '../../src/test/assert.ts'
import {type ConfigFileSchema, parse} from './config-file.ts'

test('defaults', () => {
  const config: ConfigFileSchema = {
    out: {dir: undefined, game: 'game', name: undefined, tagSchema: 'tagSchema'}
  }
  assert(parse('dirname/filename', JSON.stringify(config)), {
    $schema: 'https://oidoid.github.io/void/config-file.v0.json',
    entry: path.resolve('dirname', 'src/assets/index.html'),
    meta: path.resolve('dirname', 'dist/meta.json'),
    out: {
      dir: path.resolve('dirname', 'dist/public'),
      game: path.resolve('dirname', 'game'),
      name: undefined,
      tagSchema: path.resolve('dirname', 'tagSchema')
    },
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
    out: {dir: 'outDir', game: 'game', name: 'name', tagSchema: 'tagSchema'},
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
    entry: path.resolve('dirname', 'entry'),
    meta: path.resolve('dirname', 'meta'),
    out: {
      dir: path.resolve('dirname', 'outDir'),
      game: path.resolve('dirname', 'game'),
      name: 'name',
      tagSchema: path.resolve('dirname', 'tagSchema')
    },
    preloadAtlas: {
      dir: path.resolve('dirname', 'dir/'),
      image: path.resolve('dirname', 'image.webp')
    },
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
