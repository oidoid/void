/** max concurrent pointers tracked (one per finger). */
export const maxPointers: number = 5
/** bytes per PointerPoll. */
export const pollSize: number = 32
/** byte offset of the pointer array within Update. */
export const pollsOffset: number = 4
/** byte offset of WheelPoll within Update. */
export const wheelOffset: number = pollsOffset + maxPointers * pollSize
/** total byte size of the Update struct. */
export const updateByteLen: number = wheelOffset + 12
