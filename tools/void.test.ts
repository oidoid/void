import assert from 'node:assert/strict'
import {describe, test} from 'node:test'
import {Argv} from './void.ts'

describe('Argv()', () => {
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
        '--out-image=atlas.png',
        '--out-json=atlas.json',
        '--watch',
        'a.aseprite',
        'b.aseprite',
        '--',
        'posarg0',
        'posarg1'
      ]),
      {
        args: ['a.aseprite', 'b.aseprite'],
        opts: {
          '--out-image': 'atlas.png',
          '--out-json': 'atlas.json',
          '--watch': undefined
        },
        posargs: ['posarg0', 'posarg1']
      }
    )
  })
})
