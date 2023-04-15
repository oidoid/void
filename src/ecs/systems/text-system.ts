import { XY } from '@/ooz'
import { Game, QueryEnt, Sprite, System, Text } from '@/void'

export type TextEnt = QueryEnt<
  { sprites: [Sprite, ...Sprite[]]; text: Text },
  typeof query
>

// to-do: this isn't resolving right:
// - i should be able to say just 'text'
// - 'sprites & text | text' should make sprites nullable
// - 'sprites & text | !sprites & text' should make sprites nullable
const query = 'sprites & text | text'

export class TextSystem implements System<TextEnt> {
  readonly query = query

  runEnt(ent: TextEnt, game: Game<TextEnt>): void {
    if (ent.text.valid) return
    const sprites: Sprite[] = ent.sprites ?? []
    const xy = sprites?.[0]?.bounds.xy ?? new XY(0, 0)
    if (ent.sprites == null) {
      game.ecs.setEnt(ent, { sprites: <[Sprite]> sprites })
    }
    sprites.length = 0
    sprites.push(...ent.text.render(xy, game.filmByID, ent.text.layer))
  }
}
