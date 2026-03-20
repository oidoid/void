import {execFile} from 'node:child_process'
import util from 'node:util'

class ExecCommand implements PromiseLike<string> {
  readonly #exe: string
  readonly #args: readonly string[]
  #stdin?: string

  constructor(exe: string, args: readonly string[]) {
    this.#exe = exe
    this.#args = args
  }

  stdin(stdin: string): ExecCommand {
    this.#stdin = stdin
    return this
  }

  async run(): Promise<string> {
    const promise = util.promisify(execFile)(this.#exe, this.#args, {})
    if (promise.child.stdin && this.#stdin != null) {
      promise.child.stdin.write(this.#stdin)
      promise.child.stdin.end()
    }
    const {stdout, stderr} = await promise
    process.stderr.write(stderr)
    return stdout
  }

  // biome-ignore lint/suspicious/noThenProperty:;
  then<Fulfil = string, Reject = never>(
    onFulfilled?: (val: string) => Fulfil | PromiseLike<Fulfil>,
    onRejected?: (reason: unknown) => Reject | PromiseLike<Reject>
  ): Promise<Fulfil | Reject> {
    return this.run().then(onFulfilled, onRejected)
  }

  catch<Result = never>(
    onRejected?: (reason: unknown) => Result | PromiseLike<Result>
  ): Promise<string | Result> {
    return this.run().catch(onRejected)
  }

  finally(onFinished?: () => void): Promise<string> {
    return this.run().finally(onFinished)
  }
}

/**
 * ```ts
 * await exec`tee --append log.text`.stdin('hello\n')
 * ```
 */
export function exec(
  raw: TemplateStringsArray,
  ...exprs: readonly unknown[]
): ExecCommand {
  const str = String.raw({raw}, ...exprs)
  const [exe, ...args] = str.trim().split(/\s+/)
  if (!exe) throw Error('exe missing')
  return new ExecCommand(exe, args)
}
