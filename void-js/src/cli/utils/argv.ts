export type Argv<Opts extends AnyOpts> = {
  /** all the arguments not starting with `--` before `--`. */
  args: string[]
  /**
   * all options starting with `--` before `--` and their optional value. eg,
   * `{'--config'?: string; '--minify'?: string | true}`.
   */
  opts: Opts
  /** everything after `--`. */
  posargs: string[]
  /** original argument string. */
  argv: string[]
}

export type AnyOpts = {[k: string]: string | boolean}

export function Argv<Opts extends AnyOpts>(
  argv: readonly string[]
): Argv<Opts> {
  const args = []
  const posargs = []
  const opts: AnyOpts = {}
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--') {
      posargs.push(...argv.slice(i + 1))
      break
    }
    if (argv[i]!.startsWith('--')) {
      const [k, v] = argv[i]!.split(/=(.*)/).slice(0, 2)
      opts[k!] = v ?? true
    } else args.push(argv[i]!)
  }
  return {args, opts: opts as Opts, posargs, argv: [...argv]}
}
