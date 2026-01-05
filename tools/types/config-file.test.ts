import path from 'node:path'
import {test} from 'node:test'
import {assert} from '../../src/test/assert.ts'
import {parse, type VoidConfigFileSchema} from './config-file.ts'

test('defaults', () => {
  const config: VoidConfigFileSchema = {
    out: {
      dir: undefined,
      game: 'game',
      name: undefined,
      tagSchema: 'tagSchema'
    },
    atlas: {dir: 'dir', image: 'image'}
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
    atlas: {
      dir: path.resolve('dirname', 'dir'),
      image: path.resolve('dirname', 'image')
    },
    input: 'Default',
    mode: 'Int',

    dirname: 'dirname',
    filename: 'dirname/filename'
  })
})

test('overrides', () => {
  const config: Required<VoidConfigFileSchema> = {
    $schema: '$schema',
    entry: 'entry',
    meta: 'meta',
    out: {dir: 'outDir', game: 'game', name: 'name', tagSchema: 'tagSchema'},
    atlas: {dir: 'dir/', image: 'image.webp'},
    input: 'Custom',
    mode: 'Float'
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
    atlas: {
      dir: path.resolve('dirname', 'dir/'),
      image: path.resolve('dirname', 'image.webp')
    },
    input: 'Custom',
    mode: 'Float',

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
