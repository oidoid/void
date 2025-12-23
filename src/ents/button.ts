import type {AnyTag} from '../graphics/atlas.ts'
import type {Void} from '../void.ts'
import type {QueryEnt} from './ent-query.ts'
import type {Sys} from './sys.ts'

export type ButtonEnt<Tag extends AnyTag, Button extends string> = QueryEnt<
  Tag,
  ButtonSys<Tag, Button>['query']
>

export class ButtonSys<Tag extends AnyTag, Button extends string>
  implements Sys<Tag>
{
  readonly query = 'button & sprite' as const

  free(ent: ButtonEnt<Tag, Button>): void {
    buttonFree(ent)
  }

  update(
    ent: ButtonEnt<Tag, Button>,
    v: Void<Tag, 'A' | 'Click' | Button>
  ): void {
    // to-do: !v.zoo.cursor?.invalid? I should never read another ent's invalid state.
    if (!ent.invalid && !v.input.point?.invalid) return
    ent.invalid = true // to-do: every cursor movement!?

    const {button} = ent
    const toggle = button.type === 'Toggle'

    // to-do: these only need to be set if ent is invalid.
    button.pressed.x = ent.sprite.x
    button.pressed.y = ent.sprite.y
    button.pressed.w = ent.sprite.w
    button.pressed.h = ent.sprite.h
    button.selected.x = ent.sprite.x
    button.selected.y = ent.sprite.y
    button.selected.w = ent.sprite.w
    button.selected.h = ent.sprite.h
    // to-do: do I copy over everything from sprite? I thought I was trying to get away from copy everything update loops.
    // in particular, ent.sprite.z needs to be applied more uniformly across the parser but lots of stuff isn't always checking sprite.

    const hitsCursor =
      !!v.zoo.cursor && v.zoo.cursor.sprite.hitsZ(ent.sprite.clipbox, v.cam) // to-do: this won't work for world sprite since clipbox.
    const clickStarted =
      (hitsCursor && v.input.isOnStart('Click')) ||
      (v.zoo.cursor?.cursor.keyboard && v.input.isOnStart('A'))

    const on = clickStarted
      ? toggle
        ? !buttonOn(ent)
        : true
      : toggle
        ? buttonOn(ent)
        : v.input.isOn('Click') ||
          (!!v.zoo.cursor?.cursor.keyboard && v.input.isOn('A'))
    button.started = buttonOn(ent) !== on
    button.pressed.visible = on

    button.selected.visible =
      hitsCursor && !!(v.input.point?.click || v.input.point?.type === 'Mouse')

    v.input.handled ||= hitsCursor
  }
}

export function buttonFree(ent: ButtonEnt<AnyTag, string>): void {
  ent.button.pressed.free()
  ent.button.selected.free()
  ent.invalid = true
  // to-do: how to update zoo synchronously to remove the component and not run update()?
}

export function buttonSetOn(ent: ButtonEnt<AnyTag, string>, on: boolean): void {
  ent.button.pressed.visible = on
  ent.invalid = true
}

export function buttonOn(ent: Readonly<ButtonEnt<AnyTag, string>>): boolean {
  return ent.button.pressed.visible
}

// to-do: offStart() for pointer up listen? would need a boundary check too.
export function buttonOnStart(
  ent: Readonly<ButtonEnt<AnyTag, string>>
): boolean {
  return ent.button.started && buttonOn(ent)
}

export function buttonSelected(
  ent: Readonly<ButtonEnt<AnyTag, string>>
): boolean {
  return ent.button.selected.visible
}
