import { ButtonSet, pointerMap } from '@/void'
import { assertEquals } from 'std/testing/asserts.ts'

for (const button of Object.values(pointerMap)) {
  Deno.test(
    `${button} is a Button.`,
    () => assertEquals(ButtonSet.has(button), true),
  )
}
