import { gamepadMap, InputButton } from '@/void';
import { assertEquals } from 'std/testing/asserts.ts';

for (const button of Object.values(gamepadMap.buttons)) {
  Deno.test(
    `Button ${button} is an InputButton key.`,
    () => assertEquals(button in InputButton, true),
  );
}

for (const axis of Object.values(gamepadMap.axes)) {
  Deno.test(
    `Axis ${axis} is an InputButton key.`,
    () => assertEquals(axis in InputButton, true),
  );
}
