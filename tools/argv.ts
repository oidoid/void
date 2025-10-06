export type Argv = {
  /** all the arguments not starting with `--` before `--`. */
  args: string[]
  /** all options starting with `--` before `--` and their optional value. */
  opts: Opts
  /** everything after `--`. */
  posargs: string[]
}

export interface Opts {
  [k: string]: string | undefined
}

export function Argv(argv: readonly string[]): Argv {
  const args = []
  const posargs = []
  const opts: {[k: string]: string | undefined} = {}
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--') {
      posargs.push(...argv.slice(i + 1))
      break
    }
    if (argv[i]!.startsWith('--')) {
      const [k, v] = argv[i]!.split(/=(.*)/).slice(0, 2)
      opts[k!] = v
    } else args.push(argv[i]!)
  }
  return {args, opts, posargs}
}
