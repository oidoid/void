import { Button, Direction } from '@/void';

export interface GamepadMap {
  readonly buttons: Readonly<{ [index: number]: Button | Direction }>;
  readonly axes: Readonly<{ [index: number]: Direction }>;
}
