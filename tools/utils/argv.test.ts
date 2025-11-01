import assert from 'node:assert/strict'
import {test} from 'node:test'
import {Argv} from './argv.ts'

declare module './argv.ts' {
  interface Opts {
    '--config'?: string
    '--minify'?: true
    '--watch'?: true
  }
}

test('parses empty.', () => {
  assert.deepEqual<Argv>(Argv(['/usr/local/bin/node', 'tools/void.ts']), {
    args: [],
    opts: {},
    posargs: [],
    argv: ['/usr/local/bin/node', 'tools/void.ts']
  })
})

test('parses nonempty.', () => {
  assert.deepEqual<Argv>(
    Argv([
      '/usr/local/bin/node',
      'tools/void.ts',
      '--config=config',
      '--minify',
      '--watch',
      'a.aseprite',
      'b.aseprite',
      '--',
      'posarg0',
      'posarg1'
    ]),
    {
      args: ['a.aseprite', 'b.aseprite'],
      opts: {'--config': 'config', '--minify': true, '--watch': true},
      posargs: ['posarg0', 'posarg1'],
      argv: [
        '/usr/local/bin/node',
        'tools/void.ts',
        '--config=config',
        '--minify',
        '--watch',
        'a.aseprite',
        'b.aseprite',
        '--',
        'posarg0',
        'posarg1'
      ]
    }
  )
})
