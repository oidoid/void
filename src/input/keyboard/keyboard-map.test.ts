import { ButtonSet, keyboardMap } from '@/void'
import { assertEquals } from 'std/testing/asserts.ts'

for (const button of Object.values(keyboardMap)) {
  Deno.test(
    `${button} is a Button.`,
    () => assertEquals(ButtonSet.has(button), true),
  )
}
