// to-do: collapse with engine/layout.ts.

/** max concurrent pointers tracked (one per finger). */
export const maxPointers: number = 5
/** bytes per PointerPoll. */
export const pollSize: number = 32
/** byte offset of the pointer array within Update (PointersLen uint8 + 3 pad). */
export const pollsOffset: number = 4
/** byte offset of WheelPoll within Update. */
export const wheelOffset: number = pollsOffset + maxPointers * pollSize
/** byte offset of KeyboardPoll within Update (WheelPoll = 12 bytes). */
export const keyboardOffset: number = wheelOffset + 12
/** byte offset of TextLen field within KeyboardPoll (after Keys uint16 = 2 bytes). */
export const keyboardTextLenOffset: number = keyboardOffset + 2
/** byte offset of Text field within KeyboardPoll (after Keys + TextLen = 4 bytes). */
export const keyboardTextOffset: number = keyboardOffset + 4
/** byte offset of TextOverflow field within KeyboardPoll (after Text = 4100 bytes). */
export const keyboardTextOverflowOffset: number = keyboardOffset + 4100
/** max text bytes. */
export const maxTextLen: number = 4096
/** byte offset of the gamepadsLen field within Update (KeyboardPoll = 4102 bytes). */
export const gamepadsLenOffset: number = keyboardOffset + 4102
/** byte offset of the gamepad array within Update (gamepadsLen + 1 pad). */
export const gamepadsOffset: number = gamepadsLenOffset + 2
/** bytes per GamepadPoll. */
export const gamepadPollSize: number = 24
/** max concurrent gamepads tracked. */
export const maxGamepads: number = 4
/** byte offset of DeltaMs field within Update. */
export const deltaMsOffset: number =
  gamepadsOffset + maxGamepads * gamepadPollSize
/** byte offset of NowMs field within Update. */
export const nowMsOffset: number = deltaMsOffset + 8
/** byte offset of CanvasW field within Update (CSS logical px). */
export const canvasWOffset: number = nowMsOffset + 8
/** byte offset of CanvasH field within Update (CSS logical px). */
export const canvasHOffset: number = canvasWOffset + 2
/** total byte size of the Update struct. */
export const updateByteLen: number = canvasHOffset + 2
