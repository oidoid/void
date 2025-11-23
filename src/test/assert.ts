import * as nodeAssert from 'node:assert/strict'

export const assert: typeof deepEqual & Omit<typeof nodeAssert, 'default'> =
  Object.assign(deepEqual, nodeAssert)

function deepEqual<
  Expected extends Actual,
  Actual = Expected | null | undefined
>(actual: Actual, expected: Expected, msg?: string | Error): void {
  nodeAssert.deepEqual(actual, expected, msg)
}
