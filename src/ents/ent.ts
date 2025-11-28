import type {AnyTag} from '../graphics/atlas.ts'
import type {Sprite} from '../graphics/sprite.ts'
import type {Border, CompassDir, XY} from '../types/geo.ts'
import type {Void} from '../void.ts'

export interface Ent<Tag extends AnyTag> {
  free?(): void
  /** returns true if a render is required. */
  update?(v: Void<Tag, string>): boolean | undefined
}

export type Button<Tag extends AnyTag> = {
  pressed?: Sprite<Tag>
  selected?: Sprite<Tag>
  type: ButtonType
}
export type ButtonType = 'Button' | 'Toggle'

export interface Ent<Tag extends AnyTag> {
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
  fill?: XYFlag
  margin: Border
  modulo: XY
  origin: CompassDir
}
export type FollowCursor<Tag extends AnyTag> = {
  // readonly bounds: Box
  keyboard: number
  readonly pick?: Tag
  // readonly point: Tag
}
export type NinePatch<Tag extends AnyTag> = {
  border: Border
  pad: Border
  patch: {[dir in Lowercase<CompassDir>]?: Sprite<Tag>}
}
export type TextUI = {maxW: number; scale: number; origin: CompassDir}
export type XYFlag = 'XY' | 'X' | 'Y'
