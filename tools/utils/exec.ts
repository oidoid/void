import {execFile} from 'node:child_process'
import util from 'node:util'
import {isRecord} from '../../src/utils/obj-util.ts'

export type ExecOpts = {stdin?: string}

/**
 * ```ts
 * await exec`tee --append log.text ${{stdin: 'hello\n'}}`
 * ```
 */
export async function exec(
  raw: TemplateStringsArray,
  ...exprs: readonly unknown[]
): Promise<string> {
  const {exe, args, opts} = parse(raw, exprs)
  const promise = util.promisify(execFile)(exe, args, {})
  if (promise.child.stdin && opts?.stdin != null) {
    promise.child.stdin.write(opts.stdin)
    promise.child.stdin.end()
  }
  const {stdout, stderr} = await promise
  process.stderr.write(stderr)
  return stdout
}

function parse(
  raw: TemplateStringsArray,
  exprs: readonly unknown[]
): {exe: string; args: string[]; opts: ExecOpts | undefined} {
  const opts = isRecord(exprs.at(-1)) ? exprs.at(-1)! : undefined
  const parts = opts ? exprs.slice(0, -1) : exprs
  const [exe, ...args] = String.raw({raw}, ...parts)
    .trim()
    .split(/\s+/)
  if (!exe) throw Error('exe missing')
  return {exe, args, opts}
}
