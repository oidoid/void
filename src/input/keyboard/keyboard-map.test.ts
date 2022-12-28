import { Button, keyboardMap } from '@/void';
import { assertEquals } from 'std/testing/asserts.ts';

for (const button of Object.values(keyboardMap)) {
  Deno.test(
    `${button} is a Button.`,
    () => assertEquals(Button.values.has(button), true),
  );
}
