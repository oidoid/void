import {test} from 'node:test'
import {assert} from '../test/assert.ts'
import {fetchAudio} from './fetch-util.ts'

for (const [type, ok] of [
  ['audio/mpeg', true],
  ['audio/mpeg; charset=binary', true],
  ['audio/ogg', true],
  ['audio/ogg; codecs=opus', true],
  ['Audio/Ogg', true],
  ['audio/ogg ; codecs=vorbis', true],
  ['audio/ogg-invalid', false],
  ['audio/mpeg-invalid', false],
  ['text/html', false],
  [null, false]
] as const) {
  test(`fetchAudio(${type})`, async ctx => {
    const bin = new Uint8Array([0, 1, 127, 255])
    ctx.mock.method(
      globalThis,
      'fetch',
      async (url: RequestInfo | URL, opts?: RequestInit) => {
        assert(url, '/audio')
        assert(
          new Headers(opts?.headers).get('accept'),
          'audio/mpeg, audio/ogg'
        )
        return new Response(bin, {
          headers: type ? {'Content-Type': type} : {}
        })
      }
    )
    if (ok) assert(new Uint8Array(await fetchAudio('/audio')), bin)
    else
      await assert.rejects(fetchAudio('/audio'), {
        message: `bad fetch response type ${type} for /audio`
      })
  })
}

test('fetchAudio rejects HTTP errors', async ctx => {
  ctx.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(null, {
        status: 404,
        statusText: 'Not Found',
        headers: {'Content-Type': 'audio/ogg'}
      })
  )
  await assert.rejects(fetchAudio('/audio'), {
    message: 'fetch error 404: Not Found for /audio'
  })
})
