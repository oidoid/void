import { Game, QueryEnt, Sprite, System, Text } from '@/void'

export type TextEnt = QueryEnt<
  { sprites: Sprite[]; text: Text },
  typeof query
>

const query = 'sprites & text'

export class TextSystem implements System<TextEnt> {
  readonly query = query

  runEnt(ent: TextEnt, game: Game<TextEnt>): void {
    const { text, sprites } = ent
    if (text.valid) return
    sprites.length = 0
    sprites.push(...text.render(game.filmByID, text.layer))
  }
}
