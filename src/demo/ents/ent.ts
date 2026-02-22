import type * as V from '../../engine/index.ts'

export type Clock = object
export type MouseStatus = {
  primary: V.Sprite
  secondary: V.Sprite
  tertiary: V.Sprite
  locked: V.Sprite
}
export type RenderToggle = object
export type Rotate = {speed: number}
export type Tally = {updates: number}
export type ScreenshotButton = object
export type Superball = {vx: number; vy: number}
export type SuperballButton = object
