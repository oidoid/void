import {execFile} from 'node:child_process'
import util from 'node:util'

export async function exec(
  exe: string,
  ...args: readonly [...string[], {stdin?: string}] | readonly string[]
): Promise<string> {
  const opts = (typeof args.at(-1) === 'object' ? args.at(-1) : undefined) as
    | {stdin?: string}
    | undefined
  args = (opts ? args.slice(0, -1) : args) as string[]
  const promise = util.promisify(execFile)(exe, args, {})
  if (promise.child.stdin && opts?.stdin != null) {
    promise.child.stdin.write(opts.stdin)
    promise.child.stdin.end()
  }
  const {stdout, stderr} = await promise
  process.stderr.write(stderr)
  return stdout
}
