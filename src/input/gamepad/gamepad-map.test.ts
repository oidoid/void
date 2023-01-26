import { Button, gamepadMap } from '@/void'
import { assertEquals } from 'std/testing/asserts.ts'

for (const button of Object.values(gamepadMap.buttons)) {
  Deno.test(
    `${button} is a Button.`,
    () => assertEquals(Button.values.has(button), true),
  )
}

for (const axis of Object.values(gamepadMap.axes)) {
  Deno.test(`${axis} is a Button.`, () =>
    assertEquals(Button.values.has(axis), true))
}
