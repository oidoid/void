import { Button, pointerMap } from '@/void'
import { assertEquals } from 'std/testing/asserts.ts'

for (const button of Object.values(pointerMap)) {
  Deno.test(
    `${button} is a Button.`,
    () => assertEquals(Button.values.has(button), true),
  )
}
