// biome-ignore lint/correctness/useJsonImportAttributes:;
import type gameJSON from '../assets/demo.game.json'
export type Tag = keyof typeof gameJSON.atlas.anim
