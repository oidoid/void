import type {Sprite} from '../graphics/sprite.ts'
import type {Millis} from '../types/time.ts'

export type Button = {
  started: boolean
  // to-do: naming?
  pressed: Sprite
  selected: Sprite
  type: ButtonType
}

export type ButtonType = 'Button' | 'Toggle'

export type DebugLoseContextButton = {end: number}

export type DebugInput = object

/**
 * it doesn't really make sense for ents to be classes because their shared
 * independent prop bags still need to be passed in.
 */
export interface Ent {
  button?: Button
  debugInput?: DebugInput
  debugLoseContextButton?: DebugLoseContextButton
  fullscreenToggle?: FullscreenToggle
  id?: string
  /**
   * frame timestamp (`v.tick.start`) when this ent was last updated
   * (preferred), or `Infinity` to force update every frame, or `0` to suppress
   * updates. ents write `v.tick.start` after mutating to flag rendering and
   * recompute by other hooks. ents may read another ent's `invalid` to
   * determine whether it was updated in the current frame
   * (`const updated = ref.invalid >= v.tick.start`).
   */
  invalid: Millis | typeof Infinity
  name?: string
  override?: Override
  sprite?: Sprite
  zooStatus?: ZooStatus
}

export type FullscreenToggle = {noLock: boolean}

export type Override = {invalid?: boolean}

export type XYFlag = 'XY' | 'X' | 'Y'

export type ZooStatus = object
