import { PointerInput } from '@/void';

export class PointerState {
  point?: PointerInput | undefined;
  pick?: PointerInput | undefined;

  update(delta: number): void {
    this.point?.update(delta);
    this.pick?.update(delta);
  }
}
