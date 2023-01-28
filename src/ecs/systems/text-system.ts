import { ECSUpdate, Sprite, System, Text } from '@/void'

export interface TextSet {
  sprites: Sprite[]
  text: Text
}

export class TextSystem implements System<TextSet, ECSUpdate> {
  query = new Set(['sprites', 'text'] as const)

  updateEnt(set: TextSet, update: ECSUpdate): void {
    const { text, sprites } = set
    if (text.valid) return
    sprites.length = 0
    sprites.push(...text.render(update.filmByID, text.layer))
  }
}
