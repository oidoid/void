import { PartialXY } from '@/ooz'

export interface FollowCamConfig {
  readonly fill?: FollowCamFill | undefined
  readonly modulo?: PartialXY | undefined
  readonly orientation: FollowCamOrientation
  readonly pad?: PartialXY | undefined
}

export type FollowCamFill = Parameters<typeof FollowCamFillSet['has']>[0]
export const FollowCamFillSet = new Set(
  [
    /** Fill horizontally. */
    'X',
    /** Fill vertically. */
    'Y',
    /** Fill horizontally and vertically. */
    'XY',
  ] as const,
)

/** The position relative the camera's bounding box. */
export type FollowCamOrientation = Parameters<
  typeof FollowCamOrientationSet['has']
>[0]

export const FollowCamOrientationSet = new Set(
  [
    /** Top-center. */
    'North',
    /** Top-right. */
    'Northeast',
    /** Mid-right. */
    'East',
    /** Bottom-right. */
    'Southeast',
    /** Bottom-center. */
    'South',
    /** Bottom-left. */
    'Southwest',
    /** Mid-left. */
    'West',
    /** Top-left. */
    'Northwest',
    'Center',
  ] as const,
)
