import type {TagFormat} from '../graphics/atlas.ts'
import type {Sprite} from '../graphics/sprite.ts'
import type {CardinalDir, CompassDir, WH, XY} from '../types/geo.ts'
import type {Void} from '../void.ts'
import type {FollowCursor} from './follow-cursor.ts'

export interface Ent<Tag extends TagFormat> {
  free?(): void
  /** returns true if a render is required. */
  update?(v: Void<Tag, string>): boolean | undefined
}

export type Button<Tag extends TagFormat> = {
  pressed?: Sprite<Tag>
  selected?: Sprite<Tag>
  type: ButtonType
}
export type ButtonType = 'Button' | 'Toggle'

export interface Ent<Tag extends TagFormat> {
  button?: Button<Tag>
  followCam?: FollowCam
  followCursor?: FollowCursor<Tag>
  id?: string
  name?: string
  ninePatch?: NinePatch<Tag>
  sprite?: Sprite<Tag>
  text?: string
  textUI?: TextUI
}
export type FollowCam = {
  dir: CompassDir
  fill?: XYFlag
  margin: WH
  modulo: XY
}

export type NinePatch<Tag extends TagFormat> = {
  border: {[dir in Lowercase<CardinalDir>]: number}
  margin: WH
  patch: {[dir in Lowercase<CompassDir>]?: Sprite<Tag>}
}
export type TextUI = {dir: CompassDir; maxW: number; scale: number}
export type XYFlag = 'XY' | 'X' | 'Y'
