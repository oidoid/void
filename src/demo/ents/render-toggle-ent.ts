import * as V from '../../index.ts'
import type {Game} from '../game.ts'
import type {Tag} from '../types/tag.ts'

// to-do: follow cam sw.
export class RenderToggleEnt implements V.Ent {
  readonly #toggle: V.ButtonEnt<Tag, V.DefaultButton>

  constructor(v: Game) {
    this.#toggle = new V.ButtonEnt(v, {
      button: {
        w: {tag: 'background--Strawberry'},
        nw: {tag: 'background--Transparent'},
        n: {tag: 'background--Bubblegum'},
        e: {tag: 'background--Blueberry'},
        s: {tag: 'background--Kiwi'},
        origin: {tag: 'background--Grape'},
        border: {n: 1},
        margin: {w: 2, h: 2}
      },
      selected: {tag: 'background--OrangeCheckerboard'},
      toggle: true,
      text: {text: 'render', scale: 2},
      w: 64,
      h: 22,
      x: 50,
      y: 25,
      pressed: {tag: 'background--Bubblegum'}
    })
  }

  get on(): boolean {
    return this.#toggle.on
  }

  free(v: Game): void {
    this.#toggle.free(v)
  }

  /** always updates but never invalidates. */
  update(v: Game): boolean | undefined {
    return this.#toggle.update(v)
  }
}
