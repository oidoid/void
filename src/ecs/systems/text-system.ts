import { QueryToEnt, RunState, Sprite, System, Text } from '@/void'

export type TextEnt = QueryToEnt<
  { sprites: Sprite[]; text: Text },
  typeof query
>

const query = 'sprites & text'

export class TextSystem implements System<TextEnt> {
  readonly query = query

  runEnt(ent: TextEnt, state: RunState<TextEnt>): void {
    const { text, sprites } = ent
    if (text.valid) return
    sprites.length = 0
    sprites.push(...text.render(state.filmByID, text.layer))
  }
}
