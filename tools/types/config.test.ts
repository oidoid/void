import {describe, test} from 'node:test'
import {assert} from '../../src/test/assert.ts'
import type {Argv} from '../utils/argv.ts'
import {Config, parseTSConfig, type TSConfig} from './config.ts'
import type {VoidConfigFile} from './config-file.ts'

describe('Config()', () => {
  const configFile: Readonly<VoidConfigFile> = {
    $schema: 'schema',
    entry: '/project/src/index.ts',
    meta: '/project/meta.json',
    out: {
      dir: '/project/dist',
      game: '/project/game',
      name: undefined,
      tagSchema: '/project/tagSchema'
    },
    atlas: {dir: '/project/dir', image: '/project/image'},
    input: 'Default',
    mode: 'Int',
    dirname: '/project',
    filename: '/project/void.json'
  }

  const argv: Readonly<Argv> = {
    args: [],
    opts: {},
    posargs: [],
    argv: ['node', 'void.ts']
  }

  test('watch mode uses .html suffix', () => {
    const config = Config(
      {...argv, opts: {'--watch': true}},
      configFile,
      'abc1234',
      {version: '1.0.0', published: '2024-01-01'},
      '/project/tsconfig.json',
      {}
    )
    assert(config.out.filename, 'index.html')
    assert(config.watch, true)
  })

  test('build mode uses versioned suffix', () => {
    const config = Config(
      argv,
      configFile,
      'abc1234',
      {version: '1.0.0', published: '2024-01-01'},
      '/project/tsconfig.json',
      {}
    )
    assert(config.out.filename, 'index-v1.0.0+2024-01-01.abc1234.html')
  })

  test('out.name overrides entry stem', () => {
    const config = Config(
      argv,
      {...configFile, out: {...configFile.out, name: 'game'}},
      'abc1234',
      {version: '1.0.0'},
      '/project/tsconfig.json',
      {}
    )
    assert(config.out.filename, 'game-v1.0.0.abc1234.html')
  })

  test('conditions from tsconfig', () => {
    const config = Config(argv, configFile, '', {}, '/project/tsconfig.json', {
      compilerOptions: {customConditions: ['dev', 'browser']}
    })
    assert(config.conditions, ['dev', 'browser'])
  })
})

describe('parseTSConfig()', () => {
  test('JSON', () => {
    const jsonc = '{"compilerOptions": {"customConditions": ["dev"]}}'
    assert(parseTSConfig(jsonc, 'tsconfig.json'), {
      compilerOptions: {customConditions: ['dev']}
    })
  })

  test('empty JSON', () => {
    assert(parseTSConfig('{}', 'tsconfig.json'), {})
  })

  test('JSON: // in string', () => {
    const jsonc = '{"url": "https://example.com"}'
    assert(parseTSConfig(jsonc, 'tsconfig.json'), {
      url: 'https://example.com'
    } as TSConfig)
  })

  test('JSONC: single-line', () => {
    const jsonc = `{
      // This is a comment.
      "compilerOptions": {
        // Another comment.
        "customConditions": ["dev"]
      }
    }`
    assert(parseTSConfig(jsonc, 'tsconfig.json'), {
      compilerOptions: {customConditions: ['dev']}
    })
  })

  test('JSONC: end-of-line', () => {
    const jsonc = `{
      "compilerOptions": { // inline comment.
        "customConditions": ["dev"] // "another" inline.
      }
    }`
    assert(parseTSConfig(jsonc, 'tsconfig.json'), {
      compilerOptions: {customConditions: ['dev']}
    })
  })

  test('JSONC: trailing commas', () => {
    const jsonc = `{
      "compilerOptions": {
        "customConditions": ["dev"],
      },
    }`
    assert(parseTSConfig(jsonc, 'tsconfig.json'), {
      compilerOptions: {customConditions: ['dev']}
    })
  })

  test('JSONC: // in string with adjacent comment', () => {
    const jsonc = `{
      "url": "https://example.com", // real comment
      "path": "file://localhost/path"
    }`
    assert(parseTSConfig(jsonc, 'tsconfig.json'), {
      url: 'https://example.com',
      path: 'file://localhost/path'
    } as TSConfig)
  })

  test('JSONC: commented out props', () => {
    const jsonc = `{
      "extends": "./tsconfig.prod.json",
      "compilerOptions": {
        "customConditions": ["dev"], // npm link
        // "paths": {"@oidoid/void": ["../void/src"]} // esbuild
      },
      "references": [{"path": "../void"}] // ts build
    }`
    assert(parseTSConfig(jsonc, 'tsconfig.json'), {
      extends: './tsconfig.prod.json',
      compilerOptions: {customConditions: ['dev']},
      references: [{path: '../void'}]
    } as TSConfig)
  })

  test('invalid', () => {
    const jsonc = '{'
    assert.throws(() => parseTSConfig(jsonc, 'tsconfig.json'), /tsconfig\.json/)
  })
})
