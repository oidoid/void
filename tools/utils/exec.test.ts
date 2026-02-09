import {test} from 'node:test'
import {assert} from '../../src/test/assert.ts'
import {exec} from './exec.ts'

test('exec runs command and returns stdout', async () => {
  const script = 'process.stdout.write("ok\\n")'
  const stdout = await exec`${process.execPath} --eval ${script}`
  assert(stdout, 'ok\n')
})

test('exec passes stdin option', async () => {
  const script = 'process.stdin.on("data",c=>process.stdout.write(c))'
  const stdout =
    await exec`${process.execPath} --eval ${script} ${{stdin: 'hello'}}`
  assert(stdout, 'hello')
})

test('exec throws on missing exe', async () =>
  await assert.rejects(exec``, /exe missing/))

test('miscellaneous', async () => {
  assert(await exec`echo`, '\n')
  assert(await exec`echo one`, 'one\n')
  assert(await exec`echo one two`, 'one two\n')
  assert(await exec`echo 1 2 3`, '1 2 3\n')
  assert(await exec`echo @ # $`, '@ # $\n')
  assert(await exec`echo -n hello`, 'hello')
  assert(await exec`echo Aa Bb Cc`, 'Aa Bb Cc\n')
  assert(await exec`echo a,b c.d e:f`, 'a,b c.d e:f\n')
  assert(await exec`echo foo/bar baz/qux`, 'foo/bar baz/qux\n')
  assert(await exec`echo foo\\bar`, 'foo\\bar\n')
  assert(await exec`echo one\t\ttwo`, 'one two\n')
  assert(await exec`echo one   two`, 'one two\n')
  assert(await exec`   echo one`, 'one\n')
  assert(await exec`echo one   `, 'one\n')
})
