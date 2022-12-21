import { I16Box, I32, NumberXY } from '@/oidlib';
import { Input, InputState, Viewport } from '@/void';
import { assert } from '../../../oidlib/src/utils/assert.ts';
import { Str } from '../../../oidlib/src/utils/Str.ts';

export interface InputPoller {
  readonly inputs: InputState;
  onEvent(event: PointerEvent): void;
  clientViewportWH: Readonly<NumberXY>;
  cam: Readonly<I16Box>;
}

export namespace InputPoller {
  export function make(): InputPoller {
    const poller: InputPoller = {
      inputs: { point: undefined, pick: undefined },
      onEvent: (event) => onEvent(poller, event),
      // Initialize to 1x1 dimensions to avoid division by zero.
      clientViewportWH: NumberXY(1, 1),
      cam: I16Box(0, 0, 1, 1),
    };
    return poller;
  }

  export function register(
    self: InputPoller,
    window: Window,
    op: 'add' | 'remove',
  ): void {
    const fn = `${op}EventListener` as const;
    const types = [
      'contextmenu',
      'pointerup',
      'pointermove',
      'pointerdown',
      'pointercancel',
      // 'touchstart',
      // 'touchmove',
      // 'touchend',
      // 'touchcancel',
    ] as const;
    for (const type of types) {
      window[fn](type, <EventListener> self.onEvent, {
        capture: true,
        passive: type != 'contextmenu' && type != 'pointerdown',
        // passive: type != 'pointerdown',
      });
    }
  }

  /** Call this function *after* processing the collected input. This function
      primes the poller to collect input for the next frame so it should occur
      towards the end of the game update loop *after* entity processing. */
  export function update(
    self: InputPoller,
    time: number,
    clientViewportWH: Readonly<NumberXY>,
    cam: Readonly<I16Box>,
  ): void {
    self.clientViewportWH = clientViewportWH;
    self.cam = cam;
    InputState.update(self.inputs, time);
  }
}

function onEvent(self: InputPoller, event: PointerEvent): void {
  const received = performance.now();
  self.inputs.point = eventToPoint(self, event, received);
  self.inputs.pick = eventToPick(self, event, received);
  // event.stopImmediatePropagation();
  if (event.type == 'contextmenu' || event.type == 'pointerdown') {
    // if (event.type == 'pointerdown')
    event.preventDefault();
  }
}

function eventToPoint(
  self: InputPoller,
  ev: PointerEvent,
  received: DOMHighResTimeStamp,
): Input | undefined {
  if (ev.type == 'pointercancel') return undefined;
  const active = ev.type == 'pointermove' || ev.type == 'pointerdown';
  const { point } = self.inputs;
  const timer = point == null ? 1 : point.active != active ? 0 : point.timer;
  const windowXY = NumberXY(ev.clientX, ev.clientY);
  const pointerType = parsePointerType(ev.pointerType);
  return {
    pointerType,
    active,
    buttons: I32(ev.buttons),
    created: ev.timeStamp,
    received,
    timer,
    windowXY, // winXY
    xy: Viewport.toLevelXY(windowXY, self.clientViewportWH, self.cam),
  };
}

function eventToPick(
  self: InputPoller,
  ev: PointerEvent,
  received: DOMHighResTimeStamp,
): Input | undefined {
  if (ev.type == 'pointercancel') return undefined;
  const { pick } = self.inputs;
  const active = ev.type == 'pointerdown' ||
    ev.type == 'pointermove' && pick?.active == true;
  const timer = pick == null ? 1 : pick.active != active ? 0 : pick.timer;
  const windowXY = NumberXY(ev.clientX, ev.clientY);
  const pointerType = parsePointerType(ev.pointerType);
  return {
    pointerType,
    active,
    buttons: I32(ev.buttons),
    created: ev.timeStamp,
    received,
    timer,
    windowXY,
    xy: Viewport.toLevelXY(windowXY, self.clientViewportWH, self.cam),
  };
}

type PointerType = 'Mouse' | 'Pen' | 'Touch';

function parsePointerType(type: string): PointerType {
  const pointerType = Str.capitalize(type);
  assert(
    pointerType == 'Mouse' || pointerType == 'Pen' || pointerType == 'Touch',
  );
  return pointerType as PointerType;
}
