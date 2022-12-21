import { I16XY, I32, NumberXY } from '@/oidlib';

export const Button = Object.freeze({
  None: 0,
  Primary: 1,
  Secondary: 2,
  Auxiliary: 4,
  Back: 8,
  Forward: 16,
});

export interface Input {
  readonly pointerType: 'Mouse' | 'Pen' | 'Touch';
  /** True if input is on. */
  readonly active: boolean;
  /** Duration in state in milliseconds. 0 on state change. When 0 and active, triggered on. When 0 and inactive,
      triggered off. */
  readonly timer: number;
  /** The position of the input in window coordinates. Pointer state polling is
      simulated through events so level position must be recalculated through
      the camera lens of each frame. See xy. */
  readonly windowXY: NumberXY;
  readonly xy: I16XY;
  readonly buttons: I32;
  // to-do: only care about whether i miss hte frame or not. if i miss it and i could have hit it, that seems like a big deal.
  readonly created: DOMHighResTimeStamp;
  readonly received: DOMHighResTimeStamp; // onEvent
}

export namespace Input {
  export function activeTriggered(
    input: Input | undefined,
  ): input is NonNullable<Input> {
    return input?.active == true && input.timer == 0;
  }

  export function activeLong(input: Input | undefined): boolean {
    return input?.active == true && input.timer > 500;
  }

  export function inactiveTriggered(input: Input | undefined): boolean {
    return input == null || !input.active && input.timer == 0;
  }

  export function update(input: Input, time: number): Input {
    return {
      active: input.active,
      buttons: input.buttons,
      created: input.created,
      pointerType: input.pointerType,
      received: input.received,
      timer: input.timer + time,
      windowXY: input.windowXY,
      xy: input.xy,
    };
  }
}
