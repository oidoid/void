import {afterEach, expect, mock, spyOn, test} from 'bun:test'
import {fetchAudio} from './fetch-util.ts'

afterEach(() => mock.restore())

test.each([
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
] as const)('fetchAudio(%s)', async (type, ok) => {
  const bin = new Uint8Array([0, 1, 127, 255])
  const fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(bin, {headers: type ? {'Content-Type': type} : {}})
  )
  if (ok) expect(new Uint8Array(await fetchAudio('/audio'))).toStrictEqual(bin)
  else
    await expect(fetchAudio('/audio')).rejects.toThrow(
      Error(`bad fetch response type ${type} for /audio`)
    )
  expect(fetchSpy).toHaveBeenCalledWith('/audio', {
    headers: {accept: 'audio/mpeg, audio/ogg'}
  })
})

test('fetchAudio rejects HTTP errors', async () => {
  spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(null, {
      status: 404,
      statusText: 'Not Found',
      headers: {'Content-Type': 'audio/ogg'}
    })
  )
  await expect(fetchAudio('/audio')).rejects.toThrow(
    Error('fetch error 404: Not Found for /audio')
  )
})
