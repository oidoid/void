import { Button } from '@/void';
import { assertEquals } from 'std/testing/asserts.ts';

const bits: readonly number[] = Object.freeze(
  Object.values(Button.toBit),
);

for (const bit of bits) {
  Deno.test(
    `Bit ${bit} is unique.`,
    () => assertEquals(bits.filter((val) => bit === val).length, 1),
  );
}

for (const bit of bits) {
  Deno.test(
    `Bit ${bit} is a nonzero power of two.`,
    () => assertEquals(Math.log2(bit) % 1, 0),
  );
}
