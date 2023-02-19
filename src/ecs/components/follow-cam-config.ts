import { Immutable, XY } from '@/ooz'

export type FollowCamConfig = {
  readonly fill?: FollowCamFill | undefined
  readonly modulo?: Partial<XY<number>> | undefined
  readonly orientation: FollowCamConfig.Orientation
  readonly pad?: Partial<XY<number>> | undefined
}

export type FollowCamFill = Parameters<typeof FollowCamFill.values['has']>[0]
export namespace FollowCamFill {
  export const values = Immutable(
    new Set(
      [
        /** Fill horizontally. */
        'X',
        /** Fill vertically. */
        'Y',
        /** Fill horizontally and vertically. */
        'XY',
      ] as const,
    ),
  )
}

export namespace FollowCamConfig {
  /** The position relative the camera's bounding box. */
  export type Orientation = Parameters<typeof Orientation.values['has']>[0]

  export namespace Orientation {
    export const values = Immutable(
      new Set(
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
      ),
    )
  }
}
