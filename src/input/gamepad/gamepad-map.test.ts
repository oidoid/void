import { Button, Direction, gamepadMap } from '@/void';
import { assertEquals } from 'std/testing/asserts.ts';

for (const button of Object.values(gamepadMap.buttons)) {
  Deno.test(
    `Button ${button} is an Button or Direction key.`,
    () => assertEquals(button in Button || button in Direction, true),
  );
}

for (const axis of Object.values(gamepadMap.axes)) {
  Deno.test(
    `Axis ${axis} is an Direction key.`,
    () => assertEquals(axis in Button, true),
  );
}
