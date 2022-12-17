import { Renderer } from '@/void';
import { UnumberMillis } from '@/oidlib';

export interface RendererStateMachine {
  readonly window: Window;
  readonly canvas: HTMLCanvasElement;
  renderer: Renderer;
  frameID?: number;
  onFrame(delta: UnumberMillis): void;
  onPause(): void;
  newRenderer(): Renderer;
  onEvent(event: Event): void;
}

export namespace RendererStateMachine {
  export function make(
    props: Omit<RendererStateMachine, 'renderer' | 'onEvent'>,
  ): RendererStateMachine {
    const machine = {
      ...props,
      renderer: props.newRenderer(),
      onEvent: (event: Event) => onEvent(machine, event),
    };
    return machine;
  }

  export function start(self: RendererStateMachine): void {
    register(self, 'add');
    resume(self);
  }

  export function stop(self: RendererStateMachine): void {
    pause(self, undefined);
    register(self, 'remove');
  }
}

function pause(self: RendererStateMachine, type: string | undefined): void {
  if (self.frameID != null) self.window.cancelAnimationFrame(self.frameID);
  delete self.frameID;
  let msg = 'Renderer paused.';
  if (type == 'visibilitychange') msg = 'Renderer paused; document unfocused.';
  else if (type == 'webglcontextlost') msg = 'Renderer paused; no GL context.';
  console.debug(msg);
  self.onPause();
}

function resume(self: RendererStateMachine): void {
  if (self.renderer.gl.isContextLost()) {
    console.debug('Renderer paused; no GL context.');
  } else if (
    document.visibilityState == 'hidden' ||
    document.visibilityState == <DocumentVisibilityState> 'unloaded'
  ) {
    console.debug('Renderer paused; document unfocused.');
  } else if (self.frameID == null) {
    console.debug('Renderer looping.');
    loop(self, undefined);
  }
}

function onEvent(self: RendererStateMachine, event: Event): void {
  event.preventDefault();
  if (event.type == 'webglcontextrestored') {
    self.renderer = self.newRenderer();
    resume(self);
  } else if (event.type == 'visibilitychange') resume(self);
  else pause(self, event.type);
}

function loop(
  self: RendererStateMachine,
  then: UnumberMillis | undefined,
): void {
  self.frameID = self.window.requestAnimationFrame((now) => {
    // Duration can be great when a frame is held for debugging. Limit it to one
    // second.
    const time = UnumberMillis(Math.min(now - (then ?? now), 1000));
    self.onFrame(time);

    // If not paused by client, request a new frame.
    if (self.frameID != null) loop(self, UnumberMillis(now));
  });
}

function register(self: RendererStateMachine, op: 'add' | 'remove'): void {
  const fn = `${op}EventListener` as const;
  for (const type of ['webglcontextrestored', 'webglcontextlost']) {
    self.canvas[fn](type, self.onEvent);
  }
  self.window[fn]('visibilitychange', self.onEvent);
}
