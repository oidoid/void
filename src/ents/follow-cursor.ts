import type {TagFormat} from '../graphics/atlas.ts'

export type FollowCursor<Tag extends TagFormat> = {keyboard: number; pick?: Tag}

// export class FollowCursorSystem<Tag extends TagFormat> {
//   /** returns true if a render is required. */
//   update?(
//     v: Void<Tag, string>,
//     ent: {cursor: FollowCursor<Tag>; sprite: Sprite<Tag>}
//   ): boolean | undefined {}
// }
