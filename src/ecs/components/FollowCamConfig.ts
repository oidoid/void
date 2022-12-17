import { I16XY, Immutable } from '@/oidlib';

export type FollowCamConfig = {
  readonly fill?: 'X' | 'Y' | 'XY';
  readonly modulo?: I16XY;
  readonly orientation: FollowCamConfig.Orientation;
  readonly pad?: I16XY;
};

export namespace FollowCamConfig {
  /** The position relative the camera's bounding box. */
  export type Orientation = Parameters<typeof Orientation.values['has']>[0];

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
    );
  }
}
