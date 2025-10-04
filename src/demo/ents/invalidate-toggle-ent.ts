import {ButtonEnt, type DefaultButton, type Ent} from '../../index.ts'
import type {Game} from '../game.ts'
import type {Tag} from '../tag.ts'

export class InvalidateToggleEnt implements Ent {
  readonly #toggle: ButtonEnt<Tag, DefaultButton>

  constructor(v: Game) {
    this.#toggle = new ButtonEnt(v, {
      button: {
        w: {tag: 'background--Strawberry'},
        nw: {tag: 'background--Cyan'},
        n: {tag: 'background--Bubblegum'},
        ne: {tag: 'background--Cucumber'},
        e: {tag: 'background--Blueberry'},
        s: {tag: 'background--Kiwi'},
        se: {tag: 'background--Mustard'},
        sw: {tag: 'background--Squash'},
        origin: {tag: 'background--Grape'},
        border: {n: 2},
        margin: {w: 2, h: 2}
      },
      selected: {tag: 'background--OrangeCheckerboard'},
      toggle: true,
      text: {text: 'invalidate', scale: 2},
      w: 80,
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
