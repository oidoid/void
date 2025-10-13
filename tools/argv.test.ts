import assert from 'node:assert/strict'
import {test} from 'node:test'
import {Argv} from './argv.ts'

declare module './argv.ts' {
  interface Opts {
    '--config'?: string | undefined
    '--minify'?: '' | undefined
    '--watch'?: '' | undefined
  }
}

test('parses empty.', () => {
  assert.deepEqual<Argv>(Argv(['/usr/local/bin/node', 'tools/void.ts']), {
    args: [],
    opts: {},
    posargs: []
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
      opts: {'--config': 'config', '--minify': undefined, '--watch': undefined},
      posargs: ['posarg0', 'posarg1']
    }
  )
})
