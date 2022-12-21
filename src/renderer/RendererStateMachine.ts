import { I16, I16Box } from '@/oidlib';
import { InstanceBuffer, Renderer } from '@/void';

export interface RendererStateMachineProps {
  readonly window: Window;
  readonly canvas: HTMLCanvasElement;
  newRenderer(): Renderer;
  /** Difference in milliseconds. */
  onFrame(delta: number): void;
  onPause(): void;
}

export class RendererStateMachine {
  #frameID: number | undefined;
  #renderer: Renderer;
  readonly #canvas: HTMLCanvasElement;
  readonly #newRenderer: () => Renderer;
  readonly #onFrame: (delta: number) => void;
  readonly #onPause: () => void;
  readonly #window: Window;

  constructor(props: RendererStateMachineProps) {
    this.#canvas = props.canvas;
    this.#frameID = undefined;
    this.#newRenderer = props.newRenderer;
    this.#onFrame = props.onFrame;
    this.#onPause = props.onPause;
    this.#renderer = props.newRenderer();
    this.#window = props.window;
  }

  isContextLost(): boolean {
    return this.#renderer.gl.isContextLost();
  }

  loseContext(): void {
    this.#renderer.loseContext?.loseContext();
  }

  // to-do: this isn't great because we go out for loop callback then back in
  // to render.
  render(
    time: number,
    scale: I16,
    cam: Readonly<I16Box>,
    instanceBuffer: InstanceBuffer,
  ): void {
    Renderer.render(this.#renderer, time, scale, cam, instanceBuffer);
  }

  restoreContext(): void {
    this.#renderer.loseContext?.restoreContext();
  }

  start(): void {
    this.#register('add');
    this.#resume();
  }

  stop(): void {
    this.#pause(undefined);
    this.#register('remove');
  }

  #isDocumentVisible(): boolean {
    return this.#window.document.visibilityState == 'visible';
  }

  #loop(then: number | undefined): void {
    this.#frameID = this.#window.requestAnimationFrame((now) => {
      // Duration can be great when a frame is held for debugging. Limit it to
      // one second.
      const delta = Math.min(now - (then ?? now), 1000);
      this.#onFrame(delta);

      // If not paused, request a new frame.
      if (this.#frameID != null) this.#loop(now);
    });
  }

  #pause(type: string | undefined): void {
    if (this.#frameID != null) this.#window.cancelAnimationFrame(this.#frameID);
    this.#frameID = undefined;
    if (type == 'visibilitychange') {
      console.debug('Renderer paused; document unfocused.');
    } else if (type == 'webglcontextlost') {
      console.debug('Renderer paused; no GL context.');
    } else console.debug('Renderer paused.');
    this.#onPause();
  }

  #resume(): void {
    const { visibilityState } = this.#window.document;
    if (this.isContextLost()) {
      console.debug('Renderer cannot resume; no GL context.');
    } else if (!this.#isDocumentVisible()) {
      console.debug(`Renderer cannot resume; document ${visibilityState}.`);
    } else if (this.#frameID == null) {
      console.debug('Renderer looping.');
      this.#loop(undefined);
    }
  }

  #onEvent = (event: Event): void => {
    event.preventDefault();
    if (event.type == 'webglcontextrestored') {
      this.#renderer = this.#newRenderer();
      this.#resume();
    } else if (event.type == 'visibilitychange' && this.#isDocumentVisible()) {
      this.#resume();
    } else this.#pause(event.type);
  };

  #register(op: 'add' | 'remove'): void {
    const fn = `${op}EventListener` as const;
    for (const type of ['webglcontextrestored', 'webglcontextlost']) {
      this.#canvas[fn](type, this.#onEvent);
    }
    this.#window[fn]('visibilitychange', this.#onEvent);
  }
}
