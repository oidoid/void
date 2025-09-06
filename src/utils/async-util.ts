import type {Millis, OriginMillis} from '../types/time.ts'

export function debounce<T extends unknown[]>(
  fn: (this: undefined, ...args: T) => void,
  delay: Millis
): {cancel(): void; (...args: T): void} {
  let timeout: number | undefined
  const cancel = () => clearTimeout(timeout)
  return Object.assign(
    (...args: T) => {
      cancel()
      timeout = setTimeout(() => fn.apply(undefined, args), delay)
    },
    {cancel}
  )
}

// to-do: cancel.
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number,
  delayMillis: Millis
): Promise<T> {
  for (let i = 0; ; i++)
    try {
      return await fn()
    } catch (err) {
      if (i >= retries) throw err
      await new Promise(fulfil => setTimeout(fulfil, delayMillis))
      delayMillis = (delayMillis * 2) as Millis
    }
}

/** schedule a new function call overwriting any previous. */
export function throttle<T extends unknown[]>(
  fn: (this: undefined, ...args: T) => void,
  period: Millis
): {cancel(): void; (...args: T): void} {
  let exec: OriginMillis = 0 as OriginMillis
  let timeout: number | undefined
  const cancel = () => clearTimeout(timeout)
  return Object.assign(
    (...args: T) => {
      cancel()
      const delay = Math.max(0, period - (performance.now() - exec))
      timeout = setTimeout(() => {
        exec = performance.now()
        fn.apply(undefined, args)
      }, delay)
    },
    {cancel}
  )
}
