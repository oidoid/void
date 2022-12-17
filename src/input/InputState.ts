import { Input } from '@/void';
import { NumberMillis } from '@/oidlib';

export interface InputState {
  point?: Input | undefined;
  pick?: Input | undefined;
}

export namespace InputState {
  export function update(state: InputState, time: NumberMillis): void {
    if (state.point != null) state.point = Input.update(state.point, time);
    if (state.pick != null) state.pick = Input.update(state.pick, time);
  }

  export function anyActive(state: InputState): boolean {
    return state.point?.active || state.pick?.active || false;
  }
}
