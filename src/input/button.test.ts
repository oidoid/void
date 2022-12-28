import { Button } from '@/void';
import { assertEquals } from 'std/testing/asserts.ts';

const bits: readonly bigint[] = Object.freeze(Object.values(Button.Bit));

for (const [button, bit] of Object.entries(Button.Bit)) {
  Deno.test(
    `${button} bit is unique.`,
    () => assertEquals(bits.filter((val) => bit === val).length, 1),
  );
}

for (const [button, bit] of Object.entries(Button.Bit)) {
  Deno.test(
    `${button} is a nonzero power of two.`,
    () => assertEquals(Math.log2(Number(bit)) % 1, 0),
  );
}
