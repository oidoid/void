import {test} from 'node:test'
import {assert} from '../../test/assert.ts'
import {Argv} from './argv.ts'

test('parses empty', () => {
  assert(Argv(['/usr/local/bin/node', 'src/cli/index.ts']), {
    args: [],
    opts: {},
    posargs: [],
    argv: ['/usr/local/bin/node', 'src/cli/index.ts']
  })
})

test('parses nonempty', () => {
  assert(
    Argv([
      '/usr/local/bin/node',
      'src/cli/index.ts',
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
        'src/cli/index.ts',
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
