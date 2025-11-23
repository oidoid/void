import * as nodeAssert from 'node:assert/strict'

export const assert: typeof deepEqual & Omit<typeof nodeAssert, 'default'> =
  Object.assign(deepEqual, nodeAssert)

function deepEqual<T>(
  actual: T | null | undefined,
  expected: T,
  msg?: string | Error
): void {
  nodeAssert.deepEqual(actual, expected, msg)
}
