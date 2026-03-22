// try to start pulling in original code
export class Input {
  #pointerId: number = -1
  #pointerX: number = 0
  #pointerY: number = 0
  #pointerDevice: number = 0
  #pointerEventType: number = 0
  #pointerButtons: number = 0
  #pointerPrimary: boolean = false
  #wheelX: number = 0
  #wheelY: number = 0
  #wheelZ: number = 0

  register(onEvent: () => void): void {
    for (const [name, type] of [
      ['pointercancel', 0],
      ['pointerdown', 1],
      ['pointermove', 2],
      ['pointerup', 3],
    ] as const) {
      addEventListener(name, (ev: PointerEvent) => {
        this.#pointerId = ev.pointerId;
        this.#pointerX = ev.clientX;
        this.#pointerY = ev.clientY;
        this.#pointerDevice = { mouse: 1, pen: 2, touch: 3 }[ev.pointerType] ?? 0;
        this.#pointerEventType = type;
        this.#pointerButtons = ev.buttons;
        this.#pointerPrimary = ev.isPrimary;
        onEvent();
      });
    }
    addEventListener('wheel', (ev: WheelEvent) => {
      this.#wheelX = ev.deltaX;
      this.#wheelY = ev.deltaY;
      this.#wheelZ = ev.deltaZ;
      onEvent();
    });
  }

  write(view: DataView): void {
    view.setInt32(0, this.#pointerId, true);
    view.setFloat32(4, this.#pointerX, true);
    view.setFloat32(8, this.#pointerY, true);
    view.setUint8(12, this.#pointerDevice);
    view.setUint8(13, this.#pointerEventType);
    view.setUint8(14, this.#pointerPrimary ? 1 : 0);
    view.setUint8(15, this.#pointerButtons);
    view.setFloat32(16, this.#wheelX, true);
    view.setFloat32(20, this.#wheelY, true);
    view.setFloat32(24, this.#wheelZ, true);
  }
}
