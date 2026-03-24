/** max concurrent pointers tracked (one per finger). */
export const maxPointers: number = 5
/** bytes per PointerPoll. */
export const pollSize: number = 32
/** byte offset of the pointer array within Update. */
export const pollsOffset: number = 4
/** byte offset of WheelPoll within Update. */
export const wheelOffset: number = pollsOffset + maxPointers * pollSize
/** byte offset of the gamepadsLen field within Update. */
export const gamepadsLenOffset: number = wheelOffset + 12
/** byte offset of the gamepad array within Update (gamepadsLen + 3 pad). */
export const gamepadsOffset: number = gamepadsLenOffset + 4
/** bytes per GamepadPoll. */
export const gamepadPollSize: number = 24
/** max concurrent gamepads tracked. */
export const maxGamepads: number = 4
/** total byte size of the Update struct. */
export const updateByteLen: number =
  gamepadsOffset + maxGamepads * gamepadPollSize
